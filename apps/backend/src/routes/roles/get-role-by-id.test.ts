import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import type { TestUserData } from "../../utils/test-utils/create-user-for-testing";
import {
	cleanupTestUser,
	createUserForTesting,
} from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/test-utils/hono-test-client";

describe("GET /roles/:id", () => {
	let testUser: TestUserData;
	let testRole: typeof rolesSchema.$inferSelect;

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Test User - GET Role by ID",
			username: `test-user-get-role-by-id-${Date.now()}`,
			permissions: ["roles.read"],
		});

		// Create a test role
		const [role] = await db
			.insert(rolesSchema)
			.values({
				name: "Test Role for GET",
				code: "test-role-for-get",
				description: "A test role for GET by ID tests",
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

	test("should return role by ID successfully", async () => {
		const response = await client.roles[":id"].$get(
			{
				param: {
					id: testRole.id,
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

		expect(data).toHaveProperty("id", testRole.id);
		expect(data).toHaveProperty("name", testRole.name);
		expect(data).toHaveProperty("code", testRole.code);
		expect(data).toHaveProperty("description", testRole.description);
		expect(data).toHaveProperty("permissions");
		expect(Array.isArray(data.permissions)).toBe(true);
		expect(data).not.toHaveProperty("permissionsToRoles");
	});

	test("should return 404 for non-existent role", async () => {
		const response = await client.roles[":id"].$get(
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

	test("should return 403 for user without roles.read permission", async () => {
		const unauthorizedUser = await createUserForTesting({
			name: "Unauthorized User",
			username: `unauthorized-user-get-role-by-id-${Date.now()}`,
			permissions: [], // No permissions
		});

		const response = await client.roles[":id"].$get(
			{
				param: {
					id: testRole.id,
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
		const response = await client.roles[":id"].$get({
			param: {
				id: testRole.id,
			},
		});

		expect(response.status).toBe(401);
	});
});
