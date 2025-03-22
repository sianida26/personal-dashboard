import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import appEnv from "../../../appEnv";
import { notFound, unauthorized } from "../../../errors/DashboardError";
import {
	createGraphClientForUser,
	msalClient,
} from "../../../services/microsoft/graphClient";
import { and, eq } from "drizzle-orm";
import db from "../../../drizzle";
import { microsoftUsers, users } from "../../../drizzle/schema/users";
import { generateAccessToken } from "../../../utils/authUtils";
import { getCookie, setCookie } from "hono/cookie";
import { createId } from "@paralleldrive/cuid2";
import type { PermissionCode } from "@repo/data";

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
const SCOPES = ["user.read"];

// Frontend callback route to receive the authorization result
const FRONTEND_CALLBACK_ROUTE = "/oauth/microsoft-callback";

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

const microsoftRouter = new Hono<HonoEnv>()
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

					userRecord = await db.query.users.findFirst({
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

					if (!userRecord) {
						throw new Error("Failed to create user");
					}
				}

				// Find or create Microsoft account link
				const existingMicrosoftAccount =
					await db.query.microsoftUsers.findFirst({
						where: and(
							eq(microsoftUsers.userId, userRecord.id),
							eq(microsoftUsers.microsoftId, userInfo.id),
						),
					});

				if (!existingMicrosoftAccount) {
					// Link Microsoft account to user
					await db.insert(microsoftUsers).values({
						userId: userRecord.id,
						microsoftId: userInfo.id,
						accessToken: tokenResponse.accessToken,
					});
				} else {
					// Update access token
					await db
						.update(microsoftUsers)
						.set({ accessToken: tokenResponse.accessToken })
						.where(
							eq(microsoftUsers.id, existingMicrosoftAccount.id),
						);
				}

				// Generate JWT token for our app
				const accessToken = await generateAccessToken({
					uid: userRecord.id,
				});

				// Collect all permissions the user has, both user-specific and role-specific
				const permissions = new Set<PermissionCode>();

				// Add user-specific permissions to the set
				for (const userPermission of userRecord.permissionsToUsers) {
					permissions.add(
						userPermission.permission.code as PermissionCode,
					);
				}

				// Add role-specific permissions to the set
				for (const userRole of userRecord.rolesToUsers) {
					for (const rolePermission of userRole.role
						.permissionsToRoles) {
						permissions.add(
							rolePermission.permission.code as PermissionCode,
						);
					}
				}

				// Create auth data
				const authData = {
					accessToken,
					user: {
						id: userRecord.id,
						name: userRecord.name,
						permissions: Array.from(permissions),
						roles: userRecord.rolesToUsers.map(
							(role) => role.role.name,
						),
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
		});

export default microsoftRouter;
