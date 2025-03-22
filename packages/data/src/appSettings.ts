// Define the allowed app settings keys
export const APP_SETTING_KEYS = ["MAINTENANCE_MODE"] as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[number];

// Define descriptions for settings
export const APP_SETTING_DESCRIPTIONS: Record<AppSettingKey, string> = {
	MAINTENANCE_MODE: "Enable maintenance mode (true/false)",
};

// Define default values for settings
export const DEFAULT_APP_SETTINGS: Record<AppSettingKey, string> = {
	MAINTENANCE_MODE: "false",
}; 