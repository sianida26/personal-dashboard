import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import appEnv from "../../../appEnv";
import { notFound, unauthorized } from "../../../errors/DashboardError";
import { msalClient } from "../../../services/microsoft/msalClient";
import { createId } from "@paralleldrive/cuid2";
import { setCookie, getCookie } from "hono/cookie";
import db from "../../../drizzle";
import { microsoftAdminTokens } from "../../../drizzle/schema/microsoftAdmin";
import authInfo from "../../../middlewares/authInfo";
import { isUserAdmin } from "../../../services/microsoft/authHelpers";
import { createGraphClientForAdmin } from "../../../services/microsoft/graphClient";

if (
	!appEnv.MICROSOFT_CLIENT_ID ||
	!appEnv.MICROSOFT_CLIENT_SECRET ||
	!appEnv.MICROSOFT_TENANT_ID
) {
	throw new Error(
		"MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_TENANT_ID must be set",
	);
}

// Define a separate redirect URI for admin authentication
const ADMIN_REDIRECT_URI = `${appEnv.BASE_URL}/auth/microsoft/admin/callback`;
// Admin requires additional scopes for application-level permissions
const ADMIN_SCOPES = ["User.Read.All", "Group.Read.All", "Directory.Read.All"];

/**
 * Microsoft Admin Router
 *
 * This router handles both:
 * 1. Microsoft Graph admin authentication (which is separate from user authentication)
 * 2. Microsoft Graph admin API operations
 *
 * The admin authentication is only used for accessing Microsoft Graph
 * with application-level permissions and does not affect the user's session.
 */
const microsoftAdminRouter = new Hono<HonoEnv>()
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
	// Authentication flow
	.get("/login", async (c) => {
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
	.get("/callback", async (c) => {
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

			if (!tokenResponse?.accessToken) {
				throw unauthorized({
					message: "Failed to authenticate with Microsoft",
				});
			}

			// Calculate expiration time
			const expiresAt =
				tokenResponse.expiresOn || new Date(Date.now() + 3600 * 1000);

			// Store token in database (persists across app restarts)
			await db.insert(microsoftAdminTokens).values({
				tokenType: "admin",
				accessToken: tokenResponse.accessToken,
				scope: tokenResponse.scopes.join(" "),
				expiresAt,
			});

			// Redirect back to the admin page
			return c.redirect(`${appEnv.FRONTEND_URL}/admin`);
		} catch (error) {
			return c.json(
				{
					success: false,
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 },
			);
		}
	})
	// Only allow authenticated users with admin permissions to access the admin auth flow
	.use(authInfo)
	.use(async (c, next) => {
		const userId = c.var.uid;

		if (!userId) {
			throw unauthorized({
				message: "Authentication required",
			});
		}

		await next();
	})
	// Admin API operations
	.get("/status", async (c) => {
		// Get the current user ID from the middleware
		const userId = c.var.uid;
		if (!userId) {
			throw unauthorized({
				message: "User not found",
			});
		}

		// Get user information
		const userInfo = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, userId),
			columns: {
				id: true,
				name: true,
				email: true,
				username: true,
			},
		});

		if (!userInfo) {
			throw unauthorized({
				message: "User not found",
			});
		}

		// Try to get a Graph client (this will automatically check for valid tokens)
		const graphClient = await createGraphClientForAdmin();

		// If successful, get basic organization info to verify token works
		const orgInfo = await graphClient
			.api("/organization")
			.select("id,displayName")
			.top(1)
			.get();

		return c.json({
			authenticated: true,
			organization:
				orgInfo.value[0]?.displayName || "Microsoft Organization",
			adminUser: {
				id: userInfo.id,
				name: userInfo.name,
				email: userInfo.email || userInfo.username,
			},
			expiresAt: null, // We don't expose exact expiration time to the frontend
		});
	})
	.get("/users", async (c) => {
		try {
			// Get Microsoft Graph client with admin privileges
			const graphClient = await createGraphClientForAdmin();

			// Call Microsoft Graph API to get users
			const response = await graphClient
				.api("/users")
				.select("id,displayName,mail,userPrincipalName")
				.top(50) // Limit to 50 users
				.get();

			return c.json(response.value);
		} catch (error) {
			return c.json(
				{
					error: "Failed to fetch users",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 },
			);
		}
	})
	.post("/action", async (c) => {
		try {
			// This is just an example action - in a real application,
			// you would perform some meaningful admin operation here

			// Get admin Graph client
			const graphClient = await createGraphClientForAdmin();

			// Example: Get organization information
			const orgInfo = await graphClient
				.api("/organization")
				.select("id,displayName,verifiedDomains")
				.get();

			return c.json({
				success: true,
				message: `Action completed for organization: ${orgInfo.value[0].displayName}`,
				data: orgInfo.value[0],
			});
		} catch (error) {
			return c.json(
				{
					error: "Failed to perform admin action",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 },
			);
		}
	});

export default microsoftAdminRouter;
