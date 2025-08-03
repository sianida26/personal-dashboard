import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import db from "..";
import { permissionsSchema } from "../schema/permissions";
import { permissionsToRoles } from "../schema/permissionsToRoles";
import { rolesSchema } from "../schema/roles";
import roleSeeder from "./rolesSeeder";
import exportedRoleData from "../../data/defaultRoles";

describe("Role Seeder", () => {
	beforeEach(async () => {
		// Clean up test data before each test
		await db.delete(permissionsToRoles);
		await db.delete(rolesSchema);
		await db.delete(permissionsSchema);
	});

	afterEach(async () => {
		// Clean up test data after each test
		await db.delete(permissionsToRoles);
		await db.delete(rolesSchema);
		await db.delete(permissionsSchema);
	});

	test("should seed roles and their permissions in batch", async () => {
		// Ensure permissions exist first
		const requiredPermissions = [...new Set(
			exportedRoleData.flatMap(role => role.permissions)
		)];
		
		const permissionsData = requiredPermissions.map(permission => ({
			code: permission,
			name: permission,
		}));

		await db
			.insert(permissionsSchema)
			.values(permissionsData)
			.onConflictDoNothing();

		// Run the seeder
		await roleSeeder();

		// Verify roles were inserted
		const insertedRoles = await db
			.select()
			.from(rolesSchema)
			.where(inArray(rolesSchema.code, exportedRoleData.map(r => r.code)));

		expect(insertedRoles).toHaveLength(exportedRoleData.length);

		// Verify role-permission relationships were created
		for (const role of exportedRoleData) {
			const dbRole = insertedRoles.find(r => r.code === role.code);
			expect(dbRole).toBeDefined();
			
			if (!dbRole) continue; // This won't happen due to expect above, but satisfies TypeScript

			const rolePermissions = await db
				.select({
					permissionCode: permissionsSchema.code,
				})
				.from(permissionsToRoles)
				.innerJoin(permissionsSchema, eq(permissionsToRoles.permissionId, permissionsSchema.id))
				.where(eq(permissionsToRoles.roleId, dbRole.id));

			expect(rolePermissions).toHaveLength(role.permissions.length);
			
			const permissionCodes = rolePermissions.map(p => p.permissionCode);
			for (const permissionCode of role.permissions) {
				expect(permissionCodes).toContain(permissionCode);
			}
		}
	});

	test("should handle existing roles gracefully", async () => {
		// Ensure permissions exist first
		const requiredPermissions = [...new Set(
			exportedRoleData.flatMap(role => role.permissions)
		)];
		
		const permissionsData = requiredPermissions.map(permission => ({
			code: permission,
			name: permission,
		}));

		await db
			.insert(permissionsSchema)
			.values(permissionsData)
			.onConflictDoNothing();

		// Run seeder first time
		await roleSeeder();

		const rolesAfterFirstRun = await db.select().from(rolesSchema);
		const relationshipsAfterFirstRun = await db.select().from(permissionsToRoles);

		// Run seeder second time
		await roleSeeder();

		const rolesAfterSecondRun = await db.select().from(rolesSchema);
		const relationshipsAfterSecondRun = await db.select().from(permissionsToRoles);

		// Should not create duplicates
		expect(rolesAfterSecondRun).toHaveLength(rolesAfterFirstRun.length);
		expect(relationshipsAfterSecondRun).toHaveLength(relationshipsAfterFirstRun.length);
	});

	test("should throw error if required permissions are missing", async () => {
		// Don't insert any permissions, so they won't exist

		// Should throw an error
		await expect(roleSeeder()).rejects.toThrow(/do not exist in database/);
	});
});
