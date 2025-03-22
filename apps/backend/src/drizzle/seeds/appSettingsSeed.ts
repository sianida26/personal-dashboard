import { createId } from "@paralleldrive/cuid2";
import {
	APP_SETTING_KEYS,
	DEFAULT_APP_SETTINGS,
	type AppSettingKey,
} from "@repo/data";
import db from "../../drizzle";
import { appSettings } from "../schema/appSettingsSchema";

export async function seedAppSettings() {
	// biome-ignore lint/suspicious/noConsole: for logging in console
	console.log("Seeding app settings...");

	// Get existing settings
	const existingSettings = await db.query.appSettings.findMany();
	const existingKeys = existingSettings.map((setting) => setting.key);

	// Insert missing settings
	for (const key of APP_SETTING_KEYS) {
		if (!existingKeys.includes(key as string)) {
			await db.insert(appSettings).values({
				id: createId(),
				key: key as string,
				value: DEFAULT_APP_SETTINGS[key as AppSettingKey],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			// biome-ignore lint/suspicious/noConsole: for logging in console
			console.log(`Added app setting: ${key}`);
		}
	}

	// biome-ignore lint/suspicious/noConsole: for logging in console
	console.log("App settings seeding complete.");
}
