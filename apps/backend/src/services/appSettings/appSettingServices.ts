import db from "../../drizzle";
import { appSettingsSchema } from "../../drizzle/schema/appSettingsSchema";
import { eq } from "drizzle-orm";
import { appSettings, type AppSettingKey } from "@repo/data";
import DashboardError from "../../errors/DashboardError";

const ensureSettingRecord = async (key: AppSettingKey) => {
	const definition = appSettings.find((setting) => setting.key === key);
	if (!definition) {
		return null;
	}

	await db
		.insert(appSettingsSchema)
		.values({
			key: definition.key,
			value: definition.defaultValue,
		})
		.onConflictDoNothing();

	return await db.query.appSettingsSchema.findFirst({
		where: eq(appSettingsSchema.key, key),
	});
};

/**
 * Get an app setting by its key
 * @param key - The key of the app setting to get
 * @param throwError - Whether to throw an error if the setting doesn't exist
 * @returns The app setting value or null if it doesn't exist
 *
 * @throws {DashboardError} if the setting doesn't exist and `throwError` is true
 */
export const getAppSetting = async (key: AppSettingKey, throwError = true) => {
	let appSetting = await db.query.appSettingsSchema.findFirst({
		where: eq(appSettingsSchema.key, key),
	});
	if (!appSetting) {
		const seeded = await ensureSettingRecord(key);
		if (seeded) {
			appSetting = seeded;
		}
	}

	if (!appSetting && throwError) {
		throw new DashboardError({
			errorCode: "APP_SETTING_NOT_FOUND",
			message: `App setting with key ${key} not found`,
			severity: "HIGH",
			statusCode: 500,
		});
	}

	return appSetting;
};

/**
 * Get the value of an app setting by its key
 * @param key - The key of the app setting to get
 * @param throwError - Whether to throw an error if the setting doesn't exist (default: true)
 * @returns The app setting value or null if it doesn't exist
 *
 * @throws {DashboardError} if the setting doesn't exist and `throwError` is true
 */
export const getAppSettingValue = async (
	key: AppSettingKey,
	throwError = true,
) => {
	const appSetting = await getAppSetting(key, throwError);
	return appSetting?.value;
};

/**
 * Set the value of an app setting by its key
 * @param key - The key of the app setting to set
 * @param value - The value to set the app setting to
 */
export const setAppSetting = async (key: AppSettingKey, value: string) => {
	await db
		.update(appSettingsSchema)
		.set({ value })
		.where(eq(appSettingsSchema.key, key));
};
