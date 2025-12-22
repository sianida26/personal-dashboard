import { z } from "zod";

/**
 * Available theme modes
 * - light: Light mode
 * - dark: Dark mode
 * - system: Follow system preference
 */
export const themeModeSchema = z.enum(["light", "dark", "system"]);

/**
 * Available color schemes
 * - default: Default gray theme
 * - blue: Blue accent theme
 * - purple: Purple accent theme
 * - green: Green accent theme
 * - orange: Orange accent theme
 * - red: Red accent theme
 * - pink: Pink accent theme
 * - teal: Teal accent theme
 * - yellow: Yellow accent theme
 * - cyan: Cyan accent theme
 * - indigo: Indigo accent theme
 * - rose: Rose accent theme
 */
export const colorSchemeSchema = z.enum([
	"default",
	"blue",
	"purple",
	"green",
	"orange",
	"red",
	"pink",
	"teal",
	"yellow",
	"cyan",
	"indigo",
	"rose",
]);

/**
 * Request schema for updating user theme preferences
 */
export const updateThemePreferenceSchema = z.object({
	themeMode: themeModeSchema.optional(),
	colorScheme: colorSchemeSchema.optional(),
});

/**
 * Response schema for theme preferences
 */
export const themePreferenceSchema = z.object({
	themeMode: themeModeSchema,
	colorScheme: colorSchemeSchema,
});

// Type exports
export type ThemeMode = z.infer<typeof themeModeSchema>;
export type ColorScheme = z.infer<typeof colorSchemeSchema>;
export type UpdateThemePreference = z.infer<
	typeof updateThemePreferenceSchema
>;
export type ThemePreference = z.infer<typeof themePreferenceSchema>;
