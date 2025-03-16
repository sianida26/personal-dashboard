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
	// biome-ignore lint/suspicious/noConsole: new line for console
	console.log("\n");
	console.timeEnd("Done seeding");
	process.exit(0);
});
