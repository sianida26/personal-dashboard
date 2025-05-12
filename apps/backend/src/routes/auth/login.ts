import { zValidator } from "@hono/zod-validator";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import { eq, ne, or } from "drizzle-orm";
import { and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import { loginSchema } from "../../../../../packages/validation/src/schemas/authSchema";
import { isNull } from "drizzle-orm";
import { users } from "../../drizzle/schema/users";
import db from "../../drizzle";
import DashboardError from "../../errors/DashboardError";
import { checkPassword } from "../../utils/passwordUtils";
import { generateAccessToken } from "../../utils/authUtils";
import type { PermissionCode } from "@repo/data";
import rateLimit from "../../middlewares/rateLimiter";

const loginRoute = createHonoRoute()
	.use(
		rateLimit({
			limit: 15,
		}),
	)
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
	);

export default loginRoute;
