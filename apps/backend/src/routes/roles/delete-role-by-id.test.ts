import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createUserForTesting, cleanupTestUser } from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/test-utils/hono-test-client";
import type { TestUserData } from "../../utils/test-utils/create-user-for-testing";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import { eq } from "drizzle-orm";

describe("DELETE /roles/:id", () => {
	let testUser: TestUserData;
	const testRoleIds: string[] = [];

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Test User - DELETE Role By ID",
			username: "test-user-delete-role-by-id",
			permissions: ["roles.delete"],
		});
	});

	afterAll(async () => {
		// Clean up any remaining test roles
		for (const roleId of testRoleIds) {
			await db.delete(rolesSchema).where(eq(rolesSchema.id, roleId));
		}
		await cleanupTestUser(testUser.user.id);
	});

	test("should delete role successfully", async () => {
		// Create a test role to delete
		const [role] = await db
			.insert(rolesSchema)
			.values({
				name: "Test Role for DELETE",
				code: `test-role-for-delete-${Date.now()}`,
				description: "A test role for DELETE tests",
			})
			.returning();

		if (!role) {
			throw new Error("Failed to create test role");
		}

		const response = await client.roles[":id"].$delete(
			{
				param: {
					id: role.id,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty("message", "Role deleted successfully");

		// Verify the role is actually deleted
		const deletedRole = await db.query.rolesSchema.findFirst({
			where: eq(rolesSchema.id, role.id),
		});
		expect(deletedRole).toBeUndefined();
	});

	test("should return 404 for non-existent role", async () => {
		const response = await client.roles[":id"].$delete(
			{
				param: {
					id: "non-existent-id",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(404);
		const data = await response.json();
		expect(data).toHaveProperty("message", "Role not found");
	});

	test("should not allow deleting Super Admin role", async () => {
		// Try to find existing Super Admin role instead of creating a new one
		const superAdminRole = await db.query.rolesSchema.findFirst({
			where: eq(rolesSchema.code, "super-admin"),
		});

		if (!superAdminRole) {
			// Skip this test if Super Admin role doesn't exist
			return;
		}

		const response = await client.roles[":id"].$delete(
			{
				param: {
					id: superAdminRole.id,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(404); // Should return 404 because Super Admin can't be deleted
		const data = await response.json();
		expect(data).toHaveProperty("message", "Role not found");
	});

	test("should return 403 for user without roles.delete permission", async () => {
		// Create a test role to attempt deletion
		const [role] = await db
			.insert(rolesSchema)
			.values({
				name: "Test Role for Unauthorized DELETE",
				code: "test-role-for-unauthorized-delete",
				description: "A test role for unauthorized DELETE tests",
			})
			.returning();

		if (!role) {
			throw new Error("Failed to create test role");
		}

		testRoleIds.push(role.id); // Add to cleanup list

		const unauthorizedUser = await createUserForTesting({
			name: "Unauthorized User",
			username: `unauthorized-user-delete-role-by-id-${Date.now()}`,
			permissions: [], // No permissions
		});

		const response = await client.roles[":id"].$delete(
			{
				param: {
					id: role.id,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${unauthorizedUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(403);
		
		await cleanupTestUser(unauthorizedUser.user.id);
	});

	test("should return 401 for unauthenticated request", async () => {
		// Create a test role to attempt deletion
		const [role] = await db
			.insert(rolesSchema)
			.values({
				name: "Test Role for Unauthenticated DELETE",
				code: "test-role-for-unauthenticated-delete",
				description: "A test role for unauthenticated DELETE tests",
			})
			.returning();

		if (!role) {
			throw new Error("Failed to create test role");
		}

		testRoleIds.push(role.id); // Add to cleanup list

		const response = await client.roles[":id"].$delete({
			param: {
				id: role.id,
			},
		});

		expect(response.status).toBe(401);
	});
});
