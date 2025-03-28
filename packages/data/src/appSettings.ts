// base definition, NOT used for typing the array
export type AppSetting = {
		key: string;
		name: string;
		description: string;
		defaultValue: string;
		secret?: boolean;
	};

export const appSettings = [
	/**
	 * Default Settings
	 */
	// Username and Password Login
	{
		key: "login.usernameAndPassword.enabled",
		name: "Username and Password Login Enabled",
		description: "Enable Username and Password Login",
		defaultValue: "true",
		secret: false,
	},

	// Google OAuth
	{
		key: "oauth.google.enabled",
		name: "Google OAuth Enabled",
		description: "Enable Google OAuth",
		defaultValue: "false",
		secret: false,
	},

	// Microsoft OAuth
	{
		key: "oauth.microsoft.enabled",
		name: "Microsoft OAuth Enabled",
		description: "Enable Microsoft OAuth",
		defaultValue: "false",
		secret: false,
	},
	{
		key: "oauth.microsoft.clientId",
		name: "Microsoft OAuth Client ID",
		description: "Microsoft OAuth Client ID",
		defaultValue: "",
		secret: true,
	},
	{
		key: "oauth.microsoft.clientSecret",
		name: "Microsoft OAuth Client Secret",
		description: "Microsoft OAuth Client Secret",
		defaultValue: "",
		secret: true,
	},
	{
		key: "oauth.microsoft.redirectUri",
		name: "Microsoft OAuth Redirect URI",
		description: "Microsoft OAuth Redirect URI",
		defaultValue: "",
		secret: false,
	},
	{
		key: "oauth.microsoft.tenantId",
		name: "Microsoft OAuth Tenant ID",
		description: "Microsoft OAuth Tenant ID",
		defaultValue: "",
		secret: true,
	},
] as const satisfies readonly AppSetting[];

export const appSettingKeys = appSettings.map(
	(s) => s.key,
) as unknown as readonly (typeof appSettings)[number]["key"][];

export type AppSettingKey = (typeof appSettings)[number]["key"];
