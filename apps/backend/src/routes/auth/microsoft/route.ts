import { createId } from "@paralleldrive/cuid2";
import type { PermissionCode } from "@repo/data";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import appEnv from "../../../appEnv";
import db from "../../../drizzle";
import { oauthMicrosoft } from "../../../drizzle/schema/oauthMicrosoft";
import { users } from "../../../drizzle/schema/users";
import { notFound, unauthorized } from "../../../errors/DashboardError";
import { getAppSettingValue } from "../../../services/appSettings/appSettingServices";
import { createGraphClientForUser } from "../../../services/microsoft/graphClient";
import { getMsalClient } from "../../../services/microsoft/msalClient";
import type HonoEnv from "../../../types/HonoEnv";
import {
	buildAuthPayload,
	type UserWithAuthorization,
} from "../../../services/auth/authResponseService";
import { authMetrics, userMetrics } from "../../../utils/custom-metrics";
import microsoftAdminRouter from "./admin";

// Move the validation check inside the router middleware
// to allow the module to be imported even when Microsoft OAuth is disabled
const REDIRECT_URI = `${appEnv.BASE_URL}/auth/microsoft/callback`;
// Define a separate redirect URI for admin authentication
const ADMIN_REDIRECT_URI = `${appEnv.BASE_URL}/auth/microsoft/admin-callback`;
const SCOPES = ["user.read"];
// Admin requires additional scopes for application-level permissions
const ADMIN_SCOPES = [
	"user.read",
	"User.Read.All",
	"Group.Read.All",
	"Directory.Read.All",
];

// Frontend callback route to receive the authorization result
const FRONTEND_CALLBACK_ROUTE = "/oauth/microsoft-callback";
// Frontend callback route for admin authorization
const FRONTEND_ADMIN_CALLBACK_ROUTE = "/oauth/microsoft-admin-callback";

// Store for temp auth sessions
const tempAuthSessions = new Map<
	string,
	{
		accessToken: string;
		refreshToken: string;
		accessTokenExpiresIn: number;
		refreshTokenExpiresIn: number;
		user: {
			id: string;
			name: string;
			permissions: PermissionCode[];
			roles: string[];
		};
	}
>();

// Store for admin sessions
const adminAuthSessions = new Map<
	string,
	{
		accessToken: string;
		refreshToken: string;
		accessTokenExpiresIn: number;
		refreshTokenExpiresIn: number;
		user: {
			id: string;
			name: string;
			permissions: PermissionCode[];
			roles: string[];
			isAdmin: boolean;
		};
	}
>();

// Helper function to check if a user has admin permissions
async function isUserAdmin(userId: string): Promise<boolean> {
	// Get user with permissions and roles
	const userRecord = await db.query.users.findFirst({
		where: eq(users.id, userId),
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
		},
	});

	if (!userRecord) return false;

	// Check for admin permission or role
	// Customize this check based on your permission/role structure
	const hasAdminPermission = userRecord.permissionsToUsers.some(
		(p) => p.permission.code === "ADMIN_ACCESS",
	);

	// If your app uses role-based permissions, check roles too
	const hasAdminRole = userRecord.rolesToUsers.some(
		(r) =>
			r.role.name === "Admin" ||
			r.role.permissionsToRoles.some(
				(p) => p.permission.code === "ADMIN_ACCESS",
			),
	);

	return hasAdminPermission || hasAdminRole;
}

/**
 * Microsoft authentication router
 */
const microsoftRouter = new Hono<HonoEnv>()
	.use(async (_, next) => {
		// Check if Microsoft OAuth is enabled
		const isMicrosoftAuthEnabled = await getAppSettingValue(
			"oauth.microsoft.enabled",
		);
		if (!isMicrosoftAuthEnabled) {
			throw notFound({
				message: "Microsoft authentication is not enabled",
			});
		}
		await next();
	})
	.get("/login", async (c) => {
		// Generate state parameter for security
		const state = createId();
		// Store state in a cookie to verify on callback
		setCookie(c, "microsoft_auth_state", state, {
			httpOnly: true,
			secure: appEnv.APP_ENV === "production",
			path: "/",
			maxAge: 60 * 10, // 10 minutes
		});

		// Create authorization URL using MSAL
		const msalClient = await getMsalClient();
		const authCodeUrl = await msalClient.getAuthCodeUrl({
			scopes: SCOPES,
			redirectUri: REDIRECT_URI,
			state,
		});

		return c.redirect(authCodeUrl);
	})
	// Add a new route for admin login
	.get("/admin-login", async (c) => {
		// Generate state parameter for security
		const state = createId();
		// Store state in a cookie to verify on callback
		setCookie(c, "microsoft_admin_auth_state", state, {
			httpOnly: true,
			secure: appEnv.APP_ENV === "production",
			path: "/",
			maxAge: 60 * 10, // 10 minutes
		});

		const msalClient = await getMsalClient();
		const authCodeUrl = await msalClient.getAuthCodeUrl({
			scopes: ADMIN_SCOPES,
			redirectUri: ADMIN_REDIRECT_URI,
			state,
		});

		return c.redirect(authCodeUrl);
	})
	// Add admin callback handler
	.get("/admin-callback", async (c) => {
		const code = c.req.query("code");
		const state = c.req.query("state");
		const storedState = getCookie(c, "microsoft_admin_auth_state");

		if (!state || !storedState || state !== storedState) {
			// Validate state parameter to prevent CSRF attacks
			throw unauthorized({
				message: "Invalid state parameter",
			});
		}

		if (!code) {
			throw notFound({
				message: "Authorization code not found",
			});
		}

		try {
			// Exchange code for tokens
			const msalClient = await getMsalClient();
			const tokenResponse = await msalClient.acquireTokenByCode({
				code,
				scopes: ADMIN_SCOPES,
				redirectUri: ADMIN_REDIRECT_URI,
			});

			if (
				!tokenResponse?.account?.homeAccountId ||
				!tokenResponse.accessToken
			) {
				throw unauthorized({
					message: "Failed to authenticate with Microsoft",
				});
			}

			// Get user info from Microsoft Graph
			const graphClient = createGraphClientForUser(
				tokenResponse.accessToken,
			);
			const userInfo = await graphClient
				.api("/me")
				.select("id,displayName,mail,userPrincipalName")
				.get();

			// Find user in our database
			const userRecord = await db.query.users.findFirst({
				where: eq(
					users.email,
					userInfo.mail ?? userInfo.userPrincipalName,
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
				},
			});

			if (!userRecord) {
				throw unauthorized({
					message:
						"User not found or not authorized for admin access",
				});
			}

			// Check if user has admin permissions
			const hasAdminAccess = await isUserAdmin(userRecord.id);

			if (!hasAdminAccess) {
				throw unauthorized({
					message: "User does not have administrator privileges",
				});
			}

			// Generate a session ID for the admin
			const sessionId = createId();

			// Get all permissions from both direct assignments and roles
			const directPermissions = userRecord.permissionsToUsers.map(
				(p) => p.permission.code,
			);
			const rolePermissions = userRecord.rolesToUsers.flatMap((r) =>
				r.role.permissionsToRoles.map((p) => p.permission.code),
			);

			// Combine and deduplicate permissions
			const allPermissions = [
				...new Set([...directPermissions, ...rolePermissions]),
			] as PermissionCode[];

			// Get roles
			const roles = userRecord.rolesToUsers.map((r) => r.role.name);

			const authPayload = await buildAuthPayload(
				userRecord as UserWithAuthorization,
			);

			// Store session
			adminAuthSessions.set(sessionId, {
				accessToken: authPayload.accessToken,
				refreshToken: authPayload.refreshToken,
				accessTokenExpiresIn: authPayload.accessTokenExpiresIn,
				refreshTokenExpiresIn: authPayload.refreshTokenExpiresIn,
				user: {
					...authPayload.user,
					permissions: allPermissions,
					roles,
					isAdmin: true,
				},
			});

			// Redirect to frontend with session ID
			return c.redirect(
				`${appEnv.FRONTEND_URL}${FRONTEND_ADMIN_CALLBACK_ROUTE}?session=${sessionId}`,
			);
		} catch (error) {
			// Redirect to frontend with error
			return c.redirect(
				`${appEnv.FRONTEND_URL}/auth/error?message=${encodeURIComponent(
					error instanceof Error ? error.message : "Unknown error",
				)}`,
			);
		}
	})
	// Add endpoint to retrieve admin auth data
	.get("/admin-auth-data/:sessionId", async (c) => {
		const sessionId = c.req.param("sessionId");
		const session = adminAuthSessions.get(sessionId);

		if (!session) {
			throw notFound({
				message: "Admin session not found",
			});
		}

		// Remove session after retrieving it
		adminAuthSessions.delete(sessionId);

		return c.json(session);
	})
	.get("/callback", async (c) => {
		const code = c.req.query("code");
		const state = c.req.query("state");
		const storedState = getCookie(c, "microsoft_auth_state");

		if (!state || !storedState || state !== storedState) {
			// Validate state parameter to prevent CSRF attacks
			throw unauthorized({
				message: "Invalid state parameter",
			});
		}

		if (!code) {
			throw notFound({
				message: "Authorization code not found",
			});
		}

		try {
			// Exchange code for tokens using MSAL
			const msalClient = await getMsalClient();
			const tokenResponse = await msalClient.acquireTokenByCode({
				code,
				scopes: SCOPES,
				redirectUri: REDIRECT_URI,
			});

			if (
				!tokenResponse?.account?.homeAccountId ||
				!tokenResponse.accessToken
			) {
				throw unauthorized({
					message: "Failed to authenticate with Microsoft",
				});
			}

			// Get user info from Microsoft Graph
			const graphClient = createGraphClientForUser(
				tokenResponse.accessToken,
			);
			const userInfo = await graphClient
				.api("/me")
				.select("id,displayName,mail,userPrincipalName")
				.get();

			// Find or create user in our database
			let userRecord = await db.query.users.findFirst({
				where: eq(
					users.email,
					userInfo.mail ?? userInfo.userPrincipalName,
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
				},
			});

			// If user doesn't exist, create a new one
			if (!userRecord) {
				// Create a new user
				const newUserId = createId();
				await db.insert(users).values({
					id: newUserId,
					name: userInfo.displayName,
					username: userInfo.mail ?? userInfo.userPrincipalName,
					email: userInfo.mail ?? userInfo.userPrincipalName,
					password: "", // No password for OAuth users
					isEnabled: true,
				});

				// Track user creation
				userMetrics.userCreations.add(1, {
					method: "microsoft_oauth",
				});

				// Query the newly created user
				const createdUserRecord = await db.query.users.findFirst({
					where: eq(users.id, newUserId),
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
					},
				});

				// Assign to userRecord if it exists
				if (createdUserRecord) {
					userRecord = createdUserRecord;
				} else {
					throw new Error("Failed to create user");
				}
			}

			// Ensure userRecord is defined before proceeding
			if (!userRecord) {
				throw new Error("User record not found");
			}

			// At this point, userRecord is guaranteed to be defined
			const user = userRecord;

			// Find or create Microsoft account link
			const existingMicrosoftAccount =
				await db.query.oauthMicrosoft.findFirst({
					where: and(
						eq(oauthMicrosoft.userId, user.id),
						eq(oauthMicrosoft.providerId, userInfo.id),
					),
				});

			if (!existingMicrosoftAccount) {
				// Link Microsoft account to user
				await db.insert(oauthMicrosoft).values({
					userId: user.id,
					providerId: userInfo.id,
					accessToken: tokenResponse.accessToken,
				});
			} else {
				// Update access token
				await db
					.update(oauthMicrosoft)
					.set({ accessToken: tokenResponse.accessToken })
					.where(eq(oauthMicrosoft.id, existingMicrosoftAccount.id));
			}

			// Track successful login
			authMetrics.loginSuccesses.add(1, {
				method: "microsoft_oauth",
			});
			authMetrics.activeUsers.add(1);

			const authData = await buildAuthPayload(user as UserWithAuthorization);

			// Generate a temp session ID
			const sessionId = createId();

			// Store the auth data for retrieval
			tempAuthSessions.set(sessionId, authData);

			// Set a timeout to clean up the temp session data after 5 minutes
			setTimeout(
				() => {
					tempAuthSessions.delete(sessionId);
				},
				5 * 60 * 1000,
			);

			// Redirect to frontend with session ID
			const frontendCallbackUrl = `${appEnv.FRONTEND_URL}${FRONTEND_CALLBACK_ROUTE}?session=${sessionId}`;
			return c.redirect(frontendCallbackUrl);
		} catch (error) {
			console.error("Microsoft authentication error:", error);
			throw unauthorized({
				message: "Failed to authenticate with Microsoft",
			});
		}
	})
	.get("/auth-data/:sessionId", (c) => {
		const sessionId = c.req.param("sessionId");
		const authData = tempAuthSessions.get(sessionId);

		if (!authData) {
			throw notFound({
				message: "Auth session not found or expired",
			});
		}

		// Delete the temp session after it's retrieved
		tempAuthSessions.delete(sessionId);

		return c.json(authData);
	})
	.route("/admin", microsoftAdminRouter);

export default microsoftRouter;
