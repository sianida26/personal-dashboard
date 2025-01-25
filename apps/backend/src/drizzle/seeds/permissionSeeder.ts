import { permissions } from "@repo/data";
import db from "..";
import { permissionsSchema } from "../schema/permissions";

const permissionSeeder = async () => {
	const permissionsSeedData = permissions.map((permission) => ({
		code: permission,
		name: permission,
	}));

	console.log("Seeding permissions...");

	await db
		.insert(permissionsSchema)
		.values(permissionsSeedData)
		.onConflictDoNothing();
};

export default permissionSeeder;
