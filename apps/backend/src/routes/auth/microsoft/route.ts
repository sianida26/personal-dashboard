import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import appEnv from "../../../appEnv";
import { notFound, unauthorized } from "../../../errors/DashboardError";
import { createGraphClientForUser } from "../../../services/microsoft/graphClient";
import { and, eq } from "drizzle-orm";
import db from "../../../drizzle";
import { microsoftUsers, users } from "../../../drizzle/schema/users";
import { generateAccessToken } from "../../../utils/authUtils";
import { getCookie, setCookie } from "hono/cookie";
import { createId } from "@paralleldrive/cuid2";
import type { PermissionCode } from "@repo/data";
import { msalClient } from "../../../services/microsoft/msalClient";
import microsoftAdminRouter from "./admin";
if (
	!appEnv.MICROSOFT_CLIENT_ID ||
	!appEnv.MICROSOFT_CLIENT_SECRET ||
	!appEnv.MICROSOFT_TENANT_ID
) {
	throw new Error(
		"MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_TENANT_ID must be set",
	);
}

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

const microsoftRouter = new Hono<HonoEnv>()
	.use(async (_, next) => {
		//check if feature flag for microsoft auth is enabled
		const isMicrosoftAuthEnabled = appEnv.ENABLE_MICROSOFT_OAUTH;
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

			// Store session
			adminAuthSessions.set(sessionId, {
				accessToken: tokenResponse.accessToken,
				user: {
					id: userRecord.id,
					name: userRecord.name,
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
			// Exchange code for tokens
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
				await db.query.microsoftUsers.findFirst({
					where: and(
						eq(microsoftUsers.userId, user.id),
						eq(microsoftUsers.microsoftId, userInfo.id),
					),
				});

			if (!existingMicrosoftAccount) {
				// Link Microsoft account to user
				await db.insert(microsoftUsers).values({
					userId: user.id,
					microsoftId: userInfo.id,
					accessToken: tokenResponse.accessToken,
				});
			} else {
				// Update access token
				await db
					.update(microsoftUsers)
					.set({ accessToken: tokenResponse.accessToken })
					.where(eq(microsoftUsers.id, existingMicrosoftAccount.id));
			}

			// Generate JWT token for our app
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

			// Create auth data
			const authData = {
				accessToken,
				user: {
					id: user.id,
					name: user.name,
					permissions: Array.from(permissions),
					roles: user.rolesToUsers.map((role) => role.role.name),
				},
			};

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
