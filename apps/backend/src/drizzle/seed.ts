import appSettingsSeeder from "./seeds/appSettingsSeed";
import moneyCategoriesSeeder from "./seeds/moneyCategoriesSeeder";
import notificationPreferencesSeeder from "./seeds/notificationPreferences";
import notificationsSeeder from "./seeds/notifications";
import permissionSeeder from "./seeds/permissionSeeder";
import roleSeeder from "./seeds/rolesSeeder";
import ujianSeeder from "./seeds/ujianSeeder";
import userSeeder from "./seeds/userSeeder";
import appLogger from "../utils/logger";

const isMissingTableError = (error: unknown): boolean => {
	const maybeError = error as
		| { code?: string; cause?: { code?: string } }
		| undefined;

	return (
		maybeError?.code === "42P01" || maybeError?.cause?.code === "42P01"
	);
};

const seeder = async () => {
	console.time("Done seeding");
	await permissionSeeder();
	await roleSeeder();
	await userSeeder();
	await appSettingsSeeder();
	await notificationsSeeder();
	await notificationPreferencesSeeder();
	try {
		await ujianSeeder();
	} catch (error) {
		// Some older test databases don't include the ujian tables yet.
		// Skip this optional seed in tests to avoid unrelated money-test failures.
		if (process.env.NODE_ENV === "test" && isMissingTableError(error)) {
			appLogger.info(
				"Skipping ujian seeder in tests because ujian tables are missing.",
			);
		} else {
			throw error;
		}
	}
	await moneyCategoriesSeeder();
	console.timeEnd("Done seeding");
};

export default seeder;

// Run seeder if test environment
if (process.env.NODE_ENV !== "test") {
	await seeder().then(() => {
		process.exit(0);
	});
}
