import type { ColorScheme, ThemeMode } from "@repo/validation";

/**
 * Default theme configuration
 *
 * Change these values to set the default theme for your application.
 * These defaults will be used when:
 * - User first visits the application (no saved preferences)
 * - User clicks "Reset to Default" button
 * - Theme data cannot be loaded from storage
 */
export const DEFAULT_THEME_CONFIG = {
	/**
	 * Default theme mode
	 * Options: "light" | "dark" | "system"
	 */
	themeMode: "light" as ThemeMode,

	/**
	 * Default color scheme
	 * Options: "default" | "blue" | "purple" | "green" | "orange" | "red" |
	 *          "pink" | "teal" | "yellow" | "cyan" | "indigo" | "rose" | "navy"
	 */
	colorScheme: "default" as ColorScheme,
} as const;

/**
 * Helper function to get default theme configuration
 */
export function getDefaultTheme() {
	return DEFAULT_THEME_CONFIG;
}
