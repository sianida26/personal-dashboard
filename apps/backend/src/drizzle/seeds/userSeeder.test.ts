import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { eq } from "drizzle-orm";
import db from "..";
import { rolesSchema } from "../schema/roles";
import { rolesToUsers } from "../schema/rolesToUsers";
import { users } from "../schema/users";
import userSeeder from "./userSeeder";

describe("User Seeder", () => {
	beforeEach(async () => {
		// Clean up test data before each test
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);
	});

	afterEach(async () => {
		// Clean up test data after each test
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);
	});

	test("should seed users and their roles in batch", async () => {
		// Create required roles first
		const rolesData = [
			{
				code: "super-admin" as const,
				name: "Super Admin",
				description: "Super administrator role",
				isActive: true,
			},
		];

		await db.insert(rolesSchema).values(rolesData);

		// Run the seeder
		await userSeeder();

		// Verify users were inserted
		const insertedUsers = await db
			.select()
			.from(users)
			.where(eq(users.username, "superadmin"));

		expect(insertedUsers).toHaveLength(1);

		const user = insertedUsers[0];
		expect(user?.name).toBe("Super Admin");
		expect(user?.username).toBe("superadmin");
		
		if (!user) return; // This won't happen due to expects above, but satisfies TypeScript

		// Verify user-role relationships were created
		const userRoles = await db
			.select({
				roleCode: rolesSchema.code,
			})
			.from(rolesToUsers)
			.innerJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
			.where(eq(rolesToUsers.userId, user.id));

		expect(userRoles).toHaveLength(1);
		expect(userRoles[0]?.roleCode).toBe("super-admin");
	});

	test("should handle existing users gracefully", async () => {
		// Create required roles first
		const rolesData = [
			{
				code: "super-admin" as const,
				name: "Super Admin",
				description: "Super administrator role",
				isActive: true,
			},
		];

		await db.insert(rolesSchema).values(rolesData);

		// Run seeder first time
		await userSeeder();

		const usersAfterFirstRun = await db.select().from(users);
		const relationshipsAfterFirstRun = await db.select().from(rolesToUsers);

		// Run seeder second time
		await userSeeder();

		const usersAfterSecondRun = await db.select().from(users);
		const relationshipsAfterSecondRun = await db.select().from(rolesToUsers);

		// Should not create duplicates
		expect(usersAfterSecondRun).toHaveLength(usersAfterFirstRun.length);
		expect(relationshipsAfterSecondRun).toHaveLength(relationshipsAfterFirstRun.length);
	});

	test("should throw error if required roles are missing", async () => {
		// Don't insert any roles, so they won't exist

		// Should throw an error
		await expect(userSeeder()).rejects.toThrow(/do not exist in database/);
	});
});
