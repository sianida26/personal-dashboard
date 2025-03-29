import {
	Client,
	type AuthenticationProvider,
	type ClientOptions,
} from "@microsoft/microsoft-graph-client";
import { getMsalClient } from "./msalClient";
import db from "../../drizzle";
import { microsoftAdminTokens } from "../../drizzle/schema/microsoftAdmin";
import { and, eq, gt } from "drizzle-orm";
import { getAppSettingValue } from "../appSettings/appSettingServices";

/**
 * Microsoft Graph authentication provider that uses an access token
 */
class GraphAuthProvider implements AuthenticationProvider {
	constructor(private readonly accessToken: string) {}

	async getAccessToken() {
		return this.accessToken;
	}
}

/**
 * Creates a Microsoft Graph client instance for a specific user using their access token
 * @param accessToken The Microsoft Graph access token
 * @returns A configured Microsoft Graph client
 */
export const createGraphClientForUser = (accessToken: string) => {
	const clientOptions: ClientOptions = {
		authProvider: new GraphAuthProvider(accessToken),
	};
	return Client.initWithMiddleware(clientOptions);
};

/**
 * Validates that Microsoft OAuth is properly configured and enabled
 * @throws Error if Microsoft OAuth is not enabled or msalClient is not available
 */
const validateMicrosoftOAuth = async () => {
	const isMicrosoftAuthEnabled = await getAppSettingValue(
		"oauth.microsoft.enabled",
	);
	if (!isMicrosoftAuthEnabled) {
		throw new Error("Microsoft authentication is not enabled");
	}

	if (!getMsalClient()) {
		throw new Error("Microsoft authentication client is not available");
	}
};

/**
 * Creates a Microsoft Graph client with application permissions (admin privileges)
 * This uses client credentials flow and stores the token in the database for persistence
 * @returns A configured Microsoft Graph client with admin permissions
 */
export async function createGraphClientForAdmin() {
	try {
		validateMicrosoftOAuth();

		// Check if we have a valid token in the database
		const now = new Date();
		const adminToken = await db.query.microsoftAdminTokens.findFirst({
			where: and(
				eq(microsoftAdminTokens.tokenType, "admin"),
				gt(microsoftAdminTokens.expiresAt, now),
			),
			orderBy: (tokens) => [tokens.createdAt],
		});

		// If we have a valid token, use it
		if (adminToken) {
			return createGraphClientForUser(adminToken.accessToken);
		}

		// Otherwise, get a new token using client credentials flow
		const msalClient = await getMsalClient();

		// NOTE: If you're seeing "Insufficient privileges" errors (403), you need to:
		// 1. Go to Azure Portal -> App registrations -> [Your app] -> API permissions
		// 2. Add the necessary application permissions (not delegated) for Microsoft Graph
		// 3. Get admin consent for the application permissions
		// Common permissions needed: User.Read.All, Group.Read.All, Directory.Read.All

		// Use client credentials flow for app-only permissions
		// This is different from user interactive auth
		const tokenResponse = await msalClient.acquireTokenByClientCredential({
			scopes: ["https://graph.microsoft.com/.default"],
			skipCache: true, // Skip cache to ensure we get a fresh token
		});

		if (!tokenResponse?.accessToken) {
			throw new Error("Failed to acquire admin token");
		}

		// Calculate expiration time (typically 1 hour from now but could vary)
		const expiresInSeconds = tokenResponse.expiresOn
			? Math.floor(
					(tokenResponse.expiresOn.getTime() - Date.now()) / 1000,
				)
			: 3600;
		const expiresAt = new Date();
		expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

		// Store the token in the database for persistence
		await db.insert(microsoftAdminTokens).values({
			tokenType: "admin",
			accessToken: tokenResponse.accessToken,
			scope: tokenResponse.scopes.join(" "),
			expiresAt,
		});

		// Create and return client with admin token
		return createGraphClientForUser(tokenResponse.accessToken);
	} catch (error) {
		console.error("Error creating admin Graph client:", error);
		throw new Error(`Failed to create admin Graph client: ${error}`);
	}
}

/**
 * Retrieves a new access token for a user with their Microsoft refresh token
 * @param microsoftId The Microsoft user ID
 * @param accessToken The current access token (will be refreshed if needed)
 * @returns A new access token or the current one if still valid
 */
export async function refreshAccessToken(
	microsoftId: string,
	accessToken: string,
) {
	try {
		validateMicrosoftOAuth();

		// First try the existing token with a simple request
		const client = createGraphClientForUser(accessToken);
		await client.api("/me").select("id").get();

		// Token is still valid
		return accessToken;
	} catch (_) {
		// Token is expired, try to get a new one using MSAL
		try {
			// Get the MSAL client (this will throw if MS OAuth is not enabled)
			const msalClient = await getMsalClient();

			// Use silent token acquisition (requires implementing an account cache)
			// This is a placeholder - in a real implementation, you'd need to store
			// and retrieve refresh tokens or use MSAL's token cache
			const account = await msalClient
				.getTokenCache()
				.getAccountByHomeId(microsoftId);

			if (account) {
				const silentRequest = {
					scopes: ["user.read"],
					account,
				};

				const response =
					await msalClient.acquireTokenSilent(silentRequest);
				return response.accessToken;
			}

			throw new Error("Account not found in cache");
		} catch (refreshError) {
			throw new Error(`Failed to refresh token: ${refreshError}`);
		}
	}
}
