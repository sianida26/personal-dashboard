import { ConfidentialClientApplication } from "@azure/msal-node";
import appEnv from "../../appEnv";

/**
 * Microsoft MSAL confidential client application
 */
export const msalClient = new ConfidentialClientApplication({
	auth: {
		clientId: appEnv.MICROSOFT_CLIENT_ID ?? "",
		authority: `https://login.microsoftonline.com/${appEnv.MICROSOFT_TENANT_ID ?? ""}`,
		clientSecret: appEnv.MICROSOFT_CLIENT_SECRET ?? "",
	},
});