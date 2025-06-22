import appSettingsSeeder from "./seeds/appSettingsSeed";
import permissionSeeder from "./seeds/permissionSeeder";
import roleSeeder from "./seeds/rolesSeeder";
import userSeeder from "./seeds/userSeeder";
import { seedProjects } from "./seeds/projectsSeeder";
import db from ".";

const seeder = async () => {
	console.time("Done seeding");
	await permissionSeeder();
	await roleSeeder();
	await userSeeder();
	await appSettingsSeeder();
	// Seed observability projects after users are created
	await seedProjects(db);
	console.timeEnd("Done seeding");
};

export default seeder;
