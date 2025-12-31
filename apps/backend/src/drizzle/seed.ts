import appSettingsSeeder from "./seeds/appSettingsSeed";
import notificationPreferencesSeeder from "./seeds/notificationPreferences";
import notificationsSeeder from "./seeds/notifications";
import permissionSeeder from "./seeds/permissionSeeder";
import roleSeeder from "./seeds/rolesSeeder";
import ujianSeeder from "./seeds/ujianSeeder";
import userSeeder from "./seeds/userSeeder";

const seeder = async () => {
	console.time("Done seeding");
	await permissionSeeder();
	await roleSeeder();
	await userSeeder();
	await appSettingsSeeder();
	await notificationsSeeder();
	await notificationPreferencesSeeder();
	await ujianSeeder();
	console.timeEnd("Done seeding");
};

export default seeder;

// Run seeder if test environment
if (process.env.NODE_ENV !== "test") {
	await seeder().then(() => {
		process.exit(0);
	});
}
