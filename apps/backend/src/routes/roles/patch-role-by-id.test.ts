import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
	createUserForTesting,
	cleanupTestUser,
} from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/test-utils/hono-test-client";
import type { TestUserData } from "../../utils/test-utils/create-user-for-testing";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import { eq } from "drizzle-orm";

describe("PATCH /roles/:id", () => {
	let testUser: TestUserData;
	let testRole: typeof rolesSchema.$inferSelect;

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Test User - PATCH Role By ID",
			username: "test-user-patch-role-by-id",
			permissions: ["roles.update"],
		});

		// Create a test role
		const [role] = await db
			.insert(rolesSchema)
			.values({
				name: "Test Role for PATCH",
				code: "test-role-for-patch",
				description: "A test role for PATCH tests",
			})
			.returning();

		if (!role) {
			throw new Error("Failed to create test role");
		}

		testRole = role;
	});

	afterAll(async () => {
		// Clean up test role
		await db.delete(rolesSchema).where(eq(rolesSchema.id, testRole.id));
		await cleanupTestUser(testUser.user.id);
	});

	test("should update role successfully", async () => {
		const updateData = {
			name: "Updated Test Role",
			code: "updated-test-role",
			description: "An updated test role",
		};

		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: testRole.id,
				},
				json: updateData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data).toHaveProperty("id", testRole.id);
		expect(data).toHaveProperty("name", updateData.name);
		expect(data).toHaveProperty("code", updateData.code);
		expect(data).toHaveProperty("description", updateData.description);
	});

	test("should update role with permissions", async () => {
		const updateData = {
			name: "Updated Test Role with Permissions",
			code: "updated-test-role-with-permissions",
			description: "An updated test role with permissions",
			permissions: ["permissions.read"],
		};

		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: testRole.id,
				},
				// @ts-expect-error - bypassing type check for test
				json: updateData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data).toHaveProperty("id", testRole.id);
		expect(data).toHaveProperty("name", updateData.name);
	});

	test("should use name as code when code is not provided", async () => {
		const updateData = {
			name: "Updated Test Role Auto Code",
			description: "An updated test role with auto-generated code",
		};

		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: testRole.id,
				},
				json: updateData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data).toHaveProperty("code", updateData.name);
	});

	test("should return 404 for non-existent role", async () => {
		const updateData = {
			name: "Updated Non-existent Role",
			description: "An updated non-existent role",
		};

		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: "non-existent-id",
				},
				json: updateData,
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

	test("should not allow updating Super Admin role", async () => {
		// Try to find existing Super Admin role instead of creating a new one
		const superAdminRole = await db.query.rolesSchema.findFirst({
			where: eq(rolesSchema.name, "Super Admin"),
		});

		if (!superAdminRole) {
			// Skip this test if Super Admin role doesn't exist
			return;
		}

		const updateData = {
			name: "Updated Super Admin",
			description: "Updated Super Admin role",
		};

		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: superAdminRole.id,
				},
				json: updateData,
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

	test("should return 400 for missing required fields", async () => {
		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: testRole.id,
				},
				// @ts-expect-error - Testing invalid data structure
				json: { code: "invalid-update" },
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(422);
	});

	test("should return 403 for user without roles.update permission", async () => {
		const unauthorizedUser = await createUserForTesting({
			name: "Unauthorized User",
			username: `unauthorized-user-patch-role-by-id-${Date.now()}`,
			permissions: [], // No permissions
		});

		const updateData = {
			name: "Unauthorized Update",
			description: "An unauthorized update attempt",
		};

		const response = await client.roles[":id"].$patch(
			{
				param: {
					id: testRole.id,
				},
				json: updateData,
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
		const updateData = {
			name: "Unauthenticated Update",
			description: "An unauthenticated update attempt",
		};

		const response = await client.roles[":id"].$patch({
			param: {
				id: testRole.id,
			},
			json: updateData,
		});

		expect(response.status).toBe(401);
	});
});
