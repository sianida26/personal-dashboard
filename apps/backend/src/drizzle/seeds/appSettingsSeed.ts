import { appSettings } from "@repo/data";
import db from "..";
import { appSettings as appSettingsSchema } from "../schema/appSettingsSchema";
import { eq } from "drizzle-orm";

/**
 * Seeds the app settings in the database.
 *
 * This seeder performs the following operations:
 * 1. Removes any database records that don't exist in appSettings.ts
 * 2. Inserts new settings from appSettings.ts if they don't exist
 *
 * Note: This is a destructive operation for database records that don't exist in appSettings.ts.
 * Any settings in the database that are not defined in appSettings.ts will be deleted.
 * Existing settings will not be updated even if their default values in appSettings.ts have changed.
 *
 */
const appSettingsSeeder = async () => {
	const appSettingsSeedData = appSettings.map((setting) => ({
		key: setting.key,
		value: setting.defaultValue,
	}));

	// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
	console.log("Seeding app settings...");

	// Get all existing settings
	const existingSettings = await db.select().from(appSettingsSchema);
	const existingKeys = new Set(
		existingSettings.map((setting) => setting.key),
	);
	const validKeys = new Set(appSettings.map((setting) => setting.key));

	// Remove settings that don't exist in appSettings.ts
	const keysToDelete = existingKeys.difference(validKeys);
	if (keysToDelete.size > 0) {
		await db
			.delete(appSettingsSchema)
			.where(
				eq(
					appSettingsSchema.key,
					Array.from(keysToDelete)[0] as string,
				),
			);

		// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
		console.log(`Deleted ${keysToDelete.size} obsolete settings`);
	}

	// Insert only new settings
	await db
		.insert(appSettingsSchema)
		.values(appSettingsSeedData)
		.onConflictDoNothing();

	// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
	console.log(`Seeded ${appSettingsSeedData.length} app settings`);
};

export default appSettingsSeeder;
