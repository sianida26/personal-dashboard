// App Settings
export type AppSetting = {
	key: string;
	name: string;
	description: string;
	defaultValue: string;
};

export const appSettings: AppSetting[] = [
	/**
	 * Default Settings
	 */
	// Google OAuth
	{
		key: "oauth.google.enabled",
		name: "Google OAuth Enabled",
		description: "Enable Google OAuth",
		defaultValue: "false",
	},

	// Microsoft OAuth
	{
		key: "oauth.microsoft.enabled",
		name: "Microsoft OAuth Enabled",
		description: "Enable Microsoft OAuth",
		defaultValue: "false",
	},
	{
		key: "oauth.microsoft.clientId",
		name: "Microsoft OAuth Client ID",
		description: "Microsoft OAuth Client ID",
		defaultValue: "",
	},
	{
		key: "oauth.microsoft.clientSecret",
		name: "Microsoft OAuth Client Secret",
		description: "Microsoft OAuth Client Secret",
		defaultValue: "",
	},
	{
		key: "oauth.microsoft.redirectUri",
		name: "Microsoft OAuth Redirect URI",
		description: "Microsoft OAuth Redirect URI",
		defaultValue: "",
	},
	{
		key: "oauth.microsoft.tenantId",
		name: "Microsoft OAuth Tenant ID",
		description: "Microsoft OAuth Tenant ID",
		defaultValue: "",
	},
];
