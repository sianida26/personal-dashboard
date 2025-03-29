import { ConfidentialClientApplication } from "@azure/msal-node";
import { getAppSettingValue } from "../appSettings/appSettingServices";
import DashboardError from "../../errors/DashboardError";

/**
 * Microsoft MSAL confidential client application
 * Only created when Microsoft OAuth is enabled and all required credentials are provided
 */
let msalClient: ConfidentialClientApplication | null = null;

/**
 * Helper function to get the MSAL client with validation
 * @throws Error if Microsoft OAuth is not enabled or the client is not configured
 * @returns The MSAL client instance
 */
export async function getMsalClient(): Promise<ConfidentialClientApplication> {
	const isMicrosoftAuthEnabled = await getAppSettingValue(
		"oauth.microsoft.enabled",
	);
	if (!isMicrosoftAuthEnabled) {
		throw new Error("Microsoft OAuth is not enabled in the application");
	}

	if (!msalClient) {
		const clientId = await getAppSettingValue("oauth.microsoft.clientId");
		const tenantId = await getAppSettingValue("oauth.microsoft.tenantId");
		const clientSecret = await getAppSettingValue(
			"oauth.microsoft.clientSecret",
		);

		if (!clientId) {
			throw new DashboardError({
				message: "Microsoft OAuth client ID is not set",
				statusCode: 500,
				errorCode: "MICROSOFT_OAUTH_CLIENT_ID_NOT_SET",
				severity: "CRITICAL",
			});
		}

		if (!tenantId) {
			throw new DashboardError({
				message: "Microsoft OAuth tenant ID is not set",
				statusCode: 500,
				errorCode: "MICROSOFT_OAUTH_TENANT_ID_NOT_SET",
				severity: "CRITICAL",
			});
		}

		if (!clientSecret) {
			throw new DashboardError({
				message: "Microsoft OAuth client secret is not set",
				statusCode: 500,
				errorCode: "MICROSOFT_OAUTH_CLIENT_SECRET_NOT_SET",
				severity: "CRITICAL",
			});
		}

		msalClient = new ConfidentialClientApplication({
			auth: {
				clientId,
				authority: `https://login.microsoftonline.com/${tenantId}`,
				clientSecret,
			},
		});
	}

	return msalClient;
}
