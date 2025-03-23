import { ConfidentialClientApplication } from "@azure/msal-node";
import appEnv from "../../appEnv";

/**
 * Microsoft MSAL confidential client application
 * Only created when Microsoft OAuth is enabled and all required credentials are provided
 */
export const msalClient =
	appEnv.ENABLE_MICROSOFT_OAUTH &&
	appEnv.MICROSOFT_CLIENT_ID &&
	appEnv.MICROSOFT_TENANT_ID &&
	appEnv.MICROSOFT_CLIENT_SECRET
		? new ConfidentialClientApplication({
				auth: {
					clientId: appEnv.MICROSOFT_CLIENT_ID,
					authority: `https://login.microsoftonline.com/${appEnv.MICROSOFT_TENANT_ID}`,
					clientSecret: appEnv.MICROSOFT_CLIENT_SECRET,
				},
			})
		: null;

/**
 * Helper function to get the MSAL client with validation
 * @throws Error if Microsoft OAuth is not enabled or the client is not configured
 * @returns The MSAL client instance
 */
export function getMsalClient(): ConfidentialClientApplication {
	if (!appEnv.ENABLE_MICROSOFT_OAUTH) {
		throw new Error("Microsoft OAuth is not enabled in the application");
	}

	if (!msalClient) {
		throw new Error(
			"Microsoft authentication client is not properly configured",
		);
	}

	return msalClient;
}
