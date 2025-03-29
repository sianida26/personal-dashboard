import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import { googleAuth } from "@hono/oauth-providers/google";
import { getAppSettingValue } from "../../../services/appSettings/appSettingServices";
import DashboardError, { notFound } from "../../../errors/DashboardError";
import db from "../../../drizzle";
import { and, eq, not } from "drizzle-orm";
import { users } from "../../../drizzle/schema/users";
import { createId } from "@paralleldrive/cuid2";
import { oauthGoogle } from "../../../drizzle/schema/oauthGoogle";
import { generateAccessToken } from "../../../utils/authUtils";
import type { PermissionCode } from "@repo/data";
import appEnv from "../../../appEnv";

const FRONTEND_CALLBACK_ROUTE = "/oauth/google-callback";

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

const googleOAuthRoutes = new Hono<HonoEnv>()
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
	.use(async (c, next) => {
		const isGoogleOAuthEnabled = await getAppSettingValue(
			"oauth.google.enabled",
		);

		if (!isGoogleOAuthEnabled) {
			throw new DashboardError({
				message: "Google OAuth is not enabled",
				statusCode: 400,
				errorCode: "GOOGLE_OAUTH_NOT_ENABLED",
				severity: "LOW",
			});
		}

		const clientId = await getAppSettingValue("oauth.google.clientId");
		const clientSecret = await getAppSettingValue(
			"oauth.google.clientSecret",
		);

		if (!clientId || !clientSecret) {
			throw new DashboardError({
				message: "Google OAuth is not configured",
				statusCode: 500,
				errorCode: "GOOGLE_OAUTH_NOT_CONFIGURED",
				severity: "CRITICAL",
			});
		}

		return googleAuth({
			client_id: clientId,
			client_secret: clientSecret,
			scope: ["email", "profile", "openid"],
		})(c, next);
	})
	.get("/", async (c) => {
		const token = c.get("token");
		const user = c.get("user-google");

		if (!user) {
			throw new DashboardError({
				message: "Google OAuth user not found",
				statusCode: 500,
				errorCode: "GOOGLE_OAUTH_USER_NOT_FOUND",
				severity: "CRITICAL",
			});
		}

		if (!user.email) {
			throw new DashboardError({
				message: "Google OAuth user email not found",
				statusCode: 500,
				errorCode: "GOOGLE_OAUTH_USER_EMAIL_NOT_FOUND",
				severity: "CRITICAL",
			});
		}

		// Find or create user in our database
		let userRecord = await db.query.users.findFirst({
			where: eq(users.email, user.email),
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
			await db.insert(users).values({
				id: createId(),
				username: user.email,
				email: user.email,
				name: user.name ?? "",
				password: "",
				isEnabled: true,
			});

			// Query the newly created user
			userRecord = await db.query.users.findFirst({
				where: eq(users.email, user.email),
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
		}

		if (!userRecord) {
			throw new DashboardError({
				message: "Google OAuth user not found",
				statusCode: 500,
				errorCode: "GOOGLE_OAUTH_USER_NOT_FOUND",
				severity: "CRITICAL",
			});
		}

		// Find or create Google account link
		const existingGoogleAccount = await db.query.oauthGoogle.findFirst({
			where: and(
				eq(oauthGoogle.userId, userRecord.id),
				eq(oauthGoogle.providerId, user.id ?? ""),
				not(eq(oauthGoogle.providerId, "")),
			),
		});

		if (!existingGoogleAccount) {
			// Link Google account to user
			await db.insert(oauthGoogle).values({
				id: createId(),
				userId: userRecord.id,
				providerId: user.id ?? "",
				accessToken: token?.token ?? "",
				email: user.email ?? "",
				familyName: user.family_name,
				givenName: user.given_name,
				locale: user.locale,
				name: user.name,
				profilePictureUrl: user.picture,
			});
		} else {
			// Update access token
			await db
				.update(oauthGoogle)
				.set({ accessToken: token?.token ?? "" })
				.where(eq(oauthGoogle.id, existingGoogleAccount.id));
		}

		// Generate JWT token for our app
		const accessToken = await generateAccessToken({
			uid: userRecord.id,
		});

		// Collect all permissions the user has, both user-specific and role-specific
		const permissions = new Set<PermissionCode>();

		// Add user-specific permissions to the set
		for (const userPermission of userRecord.permissionsToUsers) {
			permissions.add(userPermission.permission.code as PermissionCode);
		}

		// Add role-specific permissions to the set
		for (const userRole of userRecord.rolesToUsers) {
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
				id: userRecord.id,
				name: userRecord.name,
				permissions: Array.from(permissions),
				roles: userRecord.rolesToUsers.map((role) => role.role.name),
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
	});

export default googleOAuthRoutes;
