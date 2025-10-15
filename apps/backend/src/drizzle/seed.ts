import appSettingsSeeder from "./seeds/appSettingsSeed";
import permissionSeeder from "./seeds/permissionSeeder";
import roleSeeder from "./seeds/rolesSeeder";
import userSeeder from "./seeds/userSeeder";
import seedObservabilityData from "./seeds/observabilitySeeder";
import notificationsSeeder from "./seeds/notifications";

const seeder = async () => {
	console.time("Done seeding");
	await permissionSeeder();
	await roleSeeder();
	await userSeeder();
	await appSettingsSeeder();
	await seedObservabilityData();
	await notificationsSeeder();
	console.timeEnd("Done seeding");
};

export default seeder;
