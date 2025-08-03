import { inArray } from "drizzle-orm";
import db from "..";
import exportedRoleData from "../../data/defaultRoles";
import { permissionsSchema } from "../schema/permissions";
import { permissionsToRoles } from "../schema/permissionsToRoles";
import { rolesSchema } from "../schema/roles";

const roleSeeder = async () => {
	console.log("Seeding roles...");

	// Step 1: Batch insert all roles
	const insertedRoles = await db
		.insert(rolesSchema)
		.values(exportedRoleData)
		.onConflictDoNothing()
		.returning();

	console.log(`${insertedRoles.length} new roles inserted`);

	// Step 2: Get all existing roles (including newly inserted ones)
	const allRoleCodes = exportedRoleData.map(role => role.code);
	const existingRoles = await db
		.select()
		.from(rolesSchema)
		.where(inArray(rolesSchema.code, allRoleCodes));

	// Create a map for quick role lookup
	const roleMap = new Map(existingRoles.map(role => [role.code, role.id]));

	// Step 3: Get all unique permission codes needed
	const allPermissionCodes = [...new Set(
		exportedRoleData.flatMap(role => role.permissions)
	)];

	// Step 4: Batch fetch all required permissions
	const existingPermissions = await db
		.select({ id: permissionsSchema.id, code: permissionsSchema.code })
		.from(permissionsSchema)
		.where(inArray(permissionsSchema.code, allPermissionCodes));

	// Create a map for quick permission lookup
	const permissionMap = new Map(existingPermissions.map(permission => [permission.code, permission.id]));

	// Step 5: Validate all permissions exist
	const missingPermissions = allPermissionCodes.filter(code => !permissionMap.has(code));
	if (missingPermissions.length > 0) {
		throw new Error(
			`The following permissions do not exist in database: ${missingPermissions.join(', ')}`
		);
	}

	// Step 6: Prepare all role-permission relationships for batch insert
	const rolePermissionRelations: Array<{ roleId: string; permissionId: string }> = [];
	
	for (const role of exportedRoleData) {
		const roleId = roleMap.get(role.code);
		if (!roleId) {
			throw new Error(`Role ${role.code} not found in database`);
		}

		for (const permissionCode of role.permissions) {
			const permissionId = permissionMap.get(permissionCode);
			if (!permissionId) {
				throw new Error(
					`Permission ID not found for code: ${permissionCode}`,
				);
			}

			rolePermissionRelations.push({
				roleId,
				permissionId,
			});
		}
	}

	// Step 7: Batch insert all role-permission relationships
	if (rolePermissionRelations.length > 0) {
		const insertedPermissions = await db
			.insert(permissionsToRoles)
			.values(rolePermissionRelations)
			.onConflictDoNothing()
			.returning();

		console.log(`${insertedPermissions.length} new role-permission relationships created`);
	}

	console.log("Role seeding completed successfully");
};

export default roleSeeder;
