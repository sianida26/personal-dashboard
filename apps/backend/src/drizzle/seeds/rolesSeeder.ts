import exportedRoleData from "../../data/defaultRoles";
import { rolesSchema } from "../schema/roles";
import db from "..";
import { permissionsToRoles } from "../schema/permissionsToRoles";
import { permissionsSchema } from "../schema/permissions";
import { eq } from "drizzle-orm";

const roleSeeder = async () => {
	console.log("Seeding roles...");

	const memoizedPermissions: Map<string, string> = new Map();

	for (let role of exportedRoleData) {
		let insertedRole = (
			await db
				.insert(rolesSchema)
				.values(role)
				.returning()
				.onConflictDoNothing()
		)[0];

		if (insertedRole) {
			console.log(`Role ${role.name} inserted`);
		} else {
			console.warn(`Role ${role.name} already exists`);
			insertedRole = (
				await db
					.select()
					.from(rolesSchema)
					.where(eq(rolesSchema.name, role.name))
			)[0];
		}

		for (let permissionCode of role.permissions) {
			if (!memoizedPermissions.has(permissionCode)) {
				const permission = (
					await db
						.select({ id: permissionsSchema.id })
						.from(permissionsSchema)
						.where(eq(permissionsSchema.code, permissionCode))
				)[0];

				if (!permission)
					throw new Error(
						`Permission ${permissionCode} does not exists in database`
					);

				memoizedPermissions.set(permissionCode, permission.id);
			}

			console.log("here");

			const insertedPermission = await db
				.insert(permissionsToRoles)
				.values({
					roleId: insertedRole.id,
					permissionId: memoizedPermissions.get(permissionCode)!,
				})
				.onConflictDoNothing()
				.returning();
			// .catch((e) =>
			// 	console.log("The permission might already been set")
			// );

			if (insertedPermission) {
				console.log(
					`Permission ${permissionCode} inserted to role ${role.name}`
				);
			} else {
				console.warn(
					`Permission ${permissionCode} already exists in role ${role.name}`
				);
			}
		}
	}
};

export default roleSeeder;
