import {
	Client,
	type AuthenticationProvider,
	type ClientOptions,
} from "@microsoft/microsoft-graph-client";
import { msalClient } from "./msalClient";

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
 * Creates a Microsoft Graph client with application permissions (admin privileges)
 * This uses client credentials flow instead of delegated permissions
 * @returns A configured Microsoft Graph client with admin permissions
 */
export async function createGraphClientForAdmin() {
	try {
		// Get token using client credentials flow (app-only permissions)
		const tokenResponse = await msalClient.acquireTokenByClientCredential({
			scopes: ["https://graph.microsoft.com/.default"], // Use .default to request all configured permissions
		});

		if (!tokenResponse?.accessToken) {
			throw new Error("Failed to acquire admin token");
		}

		// Create and return client with admin token
		return createGraphClientForUser(tokenResponse.accessToken);
	} catch (error) {
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
		// First try the existing token with a simple request
		const client = createGraphClientForUser(accessToken);
		await client.api("/me").select("id").get();

		// Token is still valid
		return accessToken;
	} catch (_) {
		// Token is expired, try to get a new one using MSAL
		try {
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
