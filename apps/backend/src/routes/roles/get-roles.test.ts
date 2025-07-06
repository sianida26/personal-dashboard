import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createUserForTesting, cleanupTestUser } from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/test-utils/hono-test-client";
import type { TestUserData } from "../../utils/test-utils/create-user-for-testing";

describe("GET /roles", () => {
	let testUser: TestUserData;

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Test User - GET Roles",
			username: "test-user-get-roles",
			permissions: ["roles.read"],
		});
	});

	afterAll(async () => {
		await cleanupTestUser(testUser.user.id);
	});

	test("should return paginated roles successfully", async () => {
		const response = await client.roles.$get(
			{
				query: {
					page: "1",
					limit: "10",
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
		
		expect(data).toHaveProperty("data");
		expect(data).toHaveProperty("_metadata");
		expect(data._metadata).toHaveProperty("currentPage", 1);
		expect(data._metadata).toHaveProperty("perPage", 10);
		expect(Array.isArray(data.data)).toBe(true);
		
		// Each role should have permissions array
		if (data.data.length > 0) {
			expect(data.data[0]).toHaveProperty("permissions");
			expect(Array.isArray(data.data[0]?.permissions)).toBe(true);
		}
	});

	test("should filter roles by search query", async () => {
		const response = await client.roles.$get(
			{
				query: {
					page: "1",
					limit: "10",
					q: "admin",
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
		expect(data).toHaveProperty("data");
		expect(Array.isArray(data.data)).toBe(true);
	});

	test("should not include Super Admin role", async () => {
		const response = await client.roles.$get(
			{
				query: {
					page: "1",
					limit: "100", // Large limit to get all roles
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
		
		// Check that no role has the name "Super Admin"
		const superAdminRole = data.data.find((role: { name: string }) => role.name === "Super Admin");
		expect(superAdminRole).toBeUndefined();
	});

	test("should return 403 for user without roles.read permission", async () => {
		const unauthorizedUser = await createUserForTesting({
			name: "Unauthorized User",
			username: `unauthorized-user-get-roles-${Date.now()}`,
			permissions: [], // No permissions
		});

		const response = await client.roles.$get(
			{
				query: {
					page: "1",
					limit: "10",
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
		const response = await client.roles.$get({
			query: {
				page: "1",
				limit: "10",
			},
		});

		expect(response.status).toBe(401);
	});

	test("should validate pagination parameters", async () => {
		const response = await client.roles.$get(
			{
				query: {
					page: "0", // Invalid page
					limit: "10",
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
});
