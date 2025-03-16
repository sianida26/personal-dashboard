import { permissions } from "@repo/data";
import db from "..";
import { permissionsSchema } from "../schema/permissions";

const permissionSeeder = async () => {
	const permissionsSeedData = permissions.map((permission) => ({
		code: permission,
		name: permission,
	}));

	// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
	console.log("Seeding permissions...");

	await db
		.insert(permissionsSchema)
		.values(permissionsSeedData)
		.onConflictDoNothing();
};

export default permissionSeeder;
