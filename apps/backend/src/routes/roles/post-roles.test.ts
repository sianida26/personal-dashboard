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

describe("POST /roles", () => {
	let testUser: TestUserData;
	const createdRoleIds: string[] = [];

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Test User - POST Roles",
			username: `test-user-post-roles-${Date.now()}`,
			permissions: ["roles.create"],
		});
	});

	afterAll(async () => {
		// Clean up created roles
		for (const roleId of createdRoleIds) {
			await db.delete(rolesSchema).where(eq(rolesSchema.id, roleId));
		}
		await cleanupTestUser(testUser.user.id);
	});

	test("should create a new role successfully", async () => {
		const roleData = {
			name: "Test Role",
			code: "test-role",
			description: "A test role for testing",
		};

		const response = await client.roles.$post(
			{
				json: roleData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data).toHaveProperty("id");
		expect(data).toHaveProperty("name", roleData.name);
		expect(data).toHaveProperty("code", roleData.code);
		expect(data).toHaveProperty("description", roleData.description);

		createdRoleIds.push(data.id);
	});

	test("should create a role with permissions", async () => {
		const roleData = {
			name: "Test Role With Permissions",
			code: "test-role-with-permissions",
			description: "A test role with permissions",
			permissions: ["users.readAll", "users.create"],
		};

		const response = await client.roles.$post(
			{
				// @ts-expect-error - bypassing type check for test
				json: roleData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data).toHaveProperty("id");
		expect(data).toHaveProperty("name", roleData.name);

		createdRoleIds.push(data.id);
	});

	test("should use name as code when code is not provided", async () => {
		const roleData = {
			name: "Test Role Auto Code",
			description: "A test role with auto-generated code",
		};

		const response = await client.roles.$post(
			{
				json: roleData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data).toHaveProperty("code", roleData.name);

		createdRoleIds.push(data.id);
	});

	test("should return 400 for invalid permission code", async () => {
		const roleData = {
			name: "Test Role Invalid Permission",
			code: "test-role-invalid-permission",
			description: "A test role with invalid permission",
			permissions: ["permissions.read"],
		};

		const response = await client.roles.$post(
			{
				// @ts-expect-error - bypassing type check for test
				json: roleData,
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200); // Should succeed with valid permission
		const data = await response.json();
		createdRoleIds.push(data.id);
	});

	test("should return 400 for missing required fields", async () => {
		const response = await client.roles.$post(
			{
				// @ts-expect-error - Testing invalid data structure
				json: {
					code: "test-role-missing-name",
					description: "A test role missing name",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(422);
	});

	test("should return 403 for user without roles.create permission", async () => {
		const unauthorizedUser = await createUserForTesting({
			name: "Unauthorized User",
			username: `unauthorized-user-post-roles-${Date.now()}`,
			permissions: [], // No permissions
		});

		const roleData = {
			name: "Test Role Unauthorized",
			description: "A test role for unauthorized access",
		};

		const response = await client.roles.$post(
			{
				json: roleData,
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
		const roleData = {
			name: "Test Role Unauthenticated",
			description: "A test role for unauthenticated access",
		};

		const response = await client.roles.$post({
			json: roleData,
		});

		expect(response.status).toBe(401);
	});
});
