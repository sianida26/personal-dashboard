import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { loginSchema } from "@repo/validation";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import DashboardError from "../../errors/DashboardError";
import checkPermission from "../../middlewares/checkPermission";
import rateLimit from "../../middlewares/rateLimiter";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import { buildAuthPayload } from "../../services/auth/authResponseService";
import type { UserWithAuthorization } from "../../services/auth/authResponseService";
import { createHonoRoute } from "../../utils/createHonoRoute";
import { authMetrics } from "../../utils/custom-metrics";
import { checkPassword } from "../../utils/passwordUtils";

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

			// Track login attempt
			authMetrics.loginAttempts.add(1, {
				method: "username_password",
			});

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
				// Track login failure
				authMetrics.loginFailures.add(1, {
					reason: "invalid_credentials",
				});
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
					// Track login failure
					authMetrics.loginFailures.add(1, {
						reason: "social_provider_required",
					});
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

				// Track login failure
				authMetrics.loginFailures.add(1, {
					reason: "no_password_set",
				});
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
				// Track login failure
				authMetrics.loginFailures.add(1, {
					reason: "invalid_password",
				});
				throw new DashboardError({
					errorCode: "INVALID_CREDENTIALS",
					message: "Invalid username or password",
					severity: "LOW",
					statusCode: 400,
				});
			}

			// Track login success
			authMetrics.loginSuccesses.add(1, {
				method: "username_password",
			});
			authMetrics.activeUsers.add(1);

			const authPayload = await buildAuthPayload(user as UserWithAuthorization);

			return c.json(authPayload);
		},
);

export default loginRoute;
