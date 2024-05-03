import db from "..";
import permissionsData from "../../data/permissions";
import { permissionsSchema } from "../schema/permissions";

const permissionSeeder = async () => {
	const permissionsSeedData =
		permissionsData as unknown as (typeof permissionsSchema.$inferInsert)[];

	console.log("Seeding permissions...");

	await db
		.insert(permissionsSchema)
		.values(permissionsSeedData)
		.onConflictDoNothing();
};

export default permissionSeeder;
