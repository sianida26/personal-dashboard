import appSettingsSeeder from "./seeds/appSettingsSeed";
import notificationsSeeder from "./seeds/notifications";
import permissionSeeder from "./seeds/permissionSeeder";
import roleSeeder from "./seeds/rolesSeeder";
import userSeeder from "./seeds/userSeeder";

const seeder = async () => {
	console.time("Done seeding");
	await permissionSeeder();
	await roleSeeder();
	await userSeeder();
	await appSettingsSeeder();
	await notificationsSeeder();
	console.timeEnd("Done seeding");
};

export default seeder;
