import { zValidator } from "@hono/zod-validator";
import type { PermissionCode } from "@repo/data";
import { loginSchema } from "@repo/validation";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import DashboardError, {
	notFound,
	unauthorized,
} from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import type HonoEnv from "../../types/HonoEnv";
import { generateAccessToken } from "../../utils/authUtils";
import { checkPassword } from "../../utils/passwordUtils";
import microsoftRouter from "./microsoft/route";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import checkPermission from "../../middlewares/checkPermission";
import googleOAuthRoutes from "./google/route";

const authRoutes = new Hono<HonoEnv>()
	// Username and Password Login
	.post(
		"/login",
		checkPermission("guest-only"),
		zValidator("json", loginSchema),
		async (c) => {
			const formData = c.req.valid("json");

			const enableUsernameAndPasswordLogin = await getAppSettingValue(
				"login.usernameAndPassword.enabled",
			);

			// If username and password login is disabled, throw an error
			if (!enableUsernameAndPasswordLogin) {
				throw new DashboardError({
					errorCode: "INVALID_CREDENTIALS",
					message: "Username and password login is disabled",
					severity: "LOW",
					statusCode: 400,
				});
			}

			// Query the database to find the user by username or email, only if the user is enabled and not deleted
			const user = await db.query.users.findFirst({
				where: and(
					isNull(users.deletedAt),
					eq(users.isEnabled, true),
					or(
						eq(
							sql`LOWER(${users.username})`,
							formData.username.toLowerCase(),
						),
						and(
							eq(
								sql`LOWER(${users.email})`,
								formData.username.toLowerCase(),
							),
							ne(users.email, ""),
						),
					),
				),
				with: {
					permissionsToUsers: {
						with: {
							permission: true,
						},
					},
					rolesToUsers: {
						with: {
							role: {
								with: {
									permissionsToRoles: {
										with: {
											permission: true,
										},
									},
								},
							},
						},
					},
					oauthGoogle: true,
					oauthMicrosoft: true,
				},
			});

			if (!user) {
				throw new DashboardError({
					errorCode: "INVALID_CREDENTIALS",
					message: "Invalid username or password",
					severity: "LOW",
					statusCode: 400,
				});
			}

			if (!user.password) {
				// Check if the user is using a social provider
				const isUsingSocialProvider =
					user.oauthGoogle || user.oauthMicrosoft;
				if (isUsingSocialProvider) {
					// Send a message to the user to login with a social provider
					throw new DashboardError({
						errorCode: "LOGIN_WITH_SOCIAL_PROVIDER",
						message: `Please login with ${
							user.oauthGoogle ? "Google" : "Microsoft"
						}`,
						severity: "LOW",
						statusCode: 400,
					});
				}

				throw new DashboardError({
					errorCode: "USER_HAS_NO_PASSWORD",
					message:
						"You must set a password to login with username and password",
					severity: "MEDIUM",
					statusCode: 400,
				});
			}

			const isSuccess = await checkPassword(
				formData.password,
				user.password,
			);

			if (!isSuccess) {
				throw new DashboardError({
					errorCode: "INVALID_CREDENTIALS",
					message: "Invalid username or password",
					severity: "LOW",
					statusCode: 400,
				});
			}

			const accessToken = await generateAccessToken({
				uid: user.id,
			});

			// Collect all permissions the user has, both user-specific and role-specific
			const permissions = new Set<PermissionCode>();

			// Add user-specific permissions to the set
			for (const userPermission of user.permissionsToUsers) {
				permissions.add(
					userPermission.permission.code as PermissionCode,
				);
			}

			// Add role-specific permissions to the set
			for (const userRole of user.rolesToUsers) {
				for (const rolePermission of userRole.role.permissionsToRoles) {
					permissions.add(
						rolePermission.permission.code as PermissionCode,
					);
				}
			}

			return c.json({
				accessToken,
				user: {
					id: user.id,
					name: user.name,
					permissions: Array.from(permissions),
					roles: user.rolesToUsers.map((role) => role.role.name),
				},
			});
		},
	)
	.get(
		"/my-profile",
		authInfo,
		checkPermission("authenticated-only"),
		async (c) => {
			const currentUser = c.var.currentUser;

			if (!currentUser || !c.var.uid) {
				throw unauthorized();
			}

			return c.json({ ...currentUser, id: c.var.uid });
		},
	)
	.get("/logout", (c) => {
		const uid = c.var.uid;

		if (!uid) {
			throw notFound();
		}

		return c.json({
			message: "Logged out successfully",
		});
	})
	.get("/login-settings", checkPermission("guest-only"), async (c) => {
		const enableGoogleOAuth = await getAppSettingValue(
			"oauth.google.enabled",
		);
		const enableMicrosoftOAuth = await getAppSettingValue(
			"oauth.microsoft.enabled",
		);
		const enableUsernameAndPasswordLogin = await getAppSettingValue(
			"login.usernameAndPassword.enabled",
		);

		return c.json({
			enableGoogleOAuth: enableGoogleOAuth === "true",
			enableMicrosoftOAuth: enableMicrosoftOAuth === "true",
			enableUsernameAndPasswordLogin:
				enableUsernameAndPasswordLogin === "true",
		});
	})
	//Google OAuth Routes
	.route("/google", googleOAuthRoutes)
	//Microsoft OAuth Routes
	.route("/microsoft", microsoftRouter);

export default authRoutes;
