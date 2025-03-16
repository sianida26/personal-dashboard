import { eq } from "drizzle-orm";
import db from "..";
import exportedRoleData from "../../data/defaultRoles";
import { permissionsSchema } from "../schema/permissions";
import { permissionsToRoles } from "../schema/permissionsToRoles";
import { rolesSchema } from "../schema/roles";

const roleSeeder = async () => {
	// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
	console.log("Seeding roles...");

	const memoizedPermissions: Map<string, string> = new Map();

	for (const role of exportedRoleData) {
		let insertedRole = (
			await db
				.insert(rolesSchema)
				.values(role)
				.returning()
				.onConflictDoNothing()
		)[0];

		if (insertedRole) {
			// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
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

		if (!insertedRole) {
			throw new Error(`Role ${role.name} not found in database`);
		}

		for (const permissionCode of role.permissions) {
			if (!memoizedPermissions.has(permissionCode)) {
				const permission = (
					await db
						.select({ id: permissionsSchema.id })
						.from(permissionsSchema)
						.where(eq(permissionsSchema.code, permissionCode))
				)[0];

				if (!permission)
					throw new Error(
						`Permission ${permissionCode} does not exists in database`,
					);

				memoizedPermissions.set(permissionCode, permission.id);
			}

			const permissionId = memoizedPermissions.get(permissionCode);
			if (!permissionId) {
				throw new Error(
					`Permission ID not found for code: ${permissionCode}`,
				);
			}

			const insertedPermission = await db
				.insert(permissionsToRoles)
				.values({
					roleId: insertedRole.id,
					permissionId,
				})
				.onConflictDoNothing()
				.returning();
			// .catch((e) =>
			// 	console.log("The permission might already been set")
			// );

			if (insertedPermission) {
				// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
				console.log(
					`Permission ${permissionCode} inserted to role ${role.name}`,
				);
			} else {
				console.warn(
					`Permission ${permissionCode} already exists in role ${role.name}`,
				);
			}
		}
	}
};

export default roleSeeder;
