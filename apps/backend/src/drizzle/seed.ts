import db from ".";
import permissionSeeder from "./seeds/permissionSeeder";
import roleSeeder from "./seeds/rolesSeeder";
import userSeeder from "./seeds/userSeeder";

(async () => {
	console.time("Done seeding");
	// await userSeeder
	await permissionSeeder();
	await roleSeeder();
	await userSeeder();
})().then(() => {
	console.log("\n");
	console.timeEnd("Done seeding");
	process.exit(0);
});

export {};
