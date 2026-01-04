import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../src/drizzle";
import { moneyAccounts } from "../../src/drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../src/drizzle/schema/moneyCategories";
import type { TestUserData } from "../../src/utils/test-utils/create-user-for-testing";
import {
	cleanupTestUser,
	createUserForTesting,
} from "../../src/utils/test-utils/create-user-for-testing";
import client from "../../src/utils/test-utils/hono-test-client";

describe("Money Tracker - Categories API", () => {
	let testUser: TestUserData;
	const createdCategoryIds: string[] = [];
	let testAccountId: string;

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Money Test User - Categories",
			username: `money-categories-test-${Date.now()}`,
			permissions: [],
		});

		// Create a test account for the user
		const [account] = await db
			.insert(moneyAccounts)
			.values({
				userId: testUser.user.id,
				name: "Test Account",
				type: "bank",
				balance: "1000.00",
				currency: "IDR",
			})
			.returning();
		if (!account) throw new Error("Failed to create test account");
		testAccountId = account.id;
	});

	afterAll(async () => {
		// Clean up created categories
		for (const categoryId of createdCategoryIds) {
			await db
				.delete(moneyCategories)
				.where(eq(moneyCategories.id, categoryId));
		}
		// Clean up test account
		await db
			.delete(moneyAccounts)
			.where(eq(moneyAccounts.id, testAccountId));
		await cleanupTestUser(testUser.user.id);
	});

	describe("POST /money/categories", () => {
		test("should create an expense category", async () => {
			const response = await client.money.categories.$post(
				{
					json: {
						name: "Food & Drinks",
						type: "expense",
						icon: "utensils",
						color: "#FF5733",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const result = await response.json();
			expect(result.data).toHaveProperty("id");
			expect(result.data?.name).toBe("Food & Drinks");
			expect(result.data?.type).toBe("expense");
			expect(result.data?.icon).toBe("utensils");
			expect(result.data?.color).toBe("#FF5733");
			expect(result.data?.isActive).toBe(true);

			if (result.data?.id) createdCategoryIds.push(result.data.id);
		});

		test("should create an income category", async () => {
			const response = await client.money.categories.$post(
				{
					json: {
						name: "Salary",
						type: "income",
						icon: "briefcase",
						color: "#28A745",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const result = await response.json();
			expect(result.data?.name).toBe("Salary");
			expect(result.data?.type).toBe("income");

			if (result.data?.id) createdCategoryIds.push(result.data.id);
		});

		test("should create a subcategory", async () => {
			// First create a parent category
			const parentResponse = await client.money.categories.$post(
				{
					json: {
						name: "Transportation",
						type: "expense",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			const parentResult = await parentResponse.json();
			if (parentResult.data?.id)
				createdCategoryIds.push(parentResult.data.id);

			// Create subcategory
			const response = await client.money.categories.$post(
				{
					json: {
						name: "Fuel",
						type: "expense",
						parentId: parentResult.data?.id ?? "",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const result = await response.json();
			expect(result.data?.parentId).toBe(parentResult.data?.id);

			if (result.data?.id) createdCategoryIds.push(result.data.id);
		});

		test("should fail with mismatched parent category type", async () => {
			// Try to create income subcategory under expense parent
			const parentId = createdCategoryIds[0]; // expense category

			const response = await client.money.categories.$post(
				{
					json: {
						name: "Invalid Subcategory",
						type: "income",
						parentId: parentId,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status as number).toBe(400);
		});

		test("should fail with invalid color format", async () => {
			const response = await client.money.categories.$post(
				{
					json: {
						name: "Invalid Color",
						type: "expense",
						color: "invalid",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			// Validation errors return 422
			expect(response.status as number).toBe(422);
		});

		test("should fail without authentication", async () => {
			const response = await client.money.categories.$post({
				json: {
					name: "Unauthorized Category",
					type: "expense",
				},
			});

			// Missing auth returns 401 or 500 depending on middleware
			expect([401, 500]).toContain(response.status);
		});
	});

	describe("GET /money/categories", () => {
		test("should return categories list", async () => {
			const response = await client.money.categories.$get(
				{
					query: {},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(Array.isArray(result.data)).toBe(true);
			expect(result.data.length).toBeGreaterThan(0);
		});

		test("should filter by type", async () => {
			const response = await client.money.categories.$get(
				{
					query: {
						type: "expense",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(
				result.data.every(
					(cat: { type: string }) => cat.type === "expense",
				),
			).toBe(true);
		});

		test("should return as tree structure", async () => {
			const response = await client.money.categories.$get(
				{
					query: {
						asTree: "true",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(Array.isArray(result.data)).toBe(true);
		});
	});

	describe("GET /money/categories/tree", () => {
		test("should return categories as tree", async () => {
			const treeEndpoint = client.money.categories.tree;
			if (!treeEndpoint || !treeEndpoint.$get)
				throw new Error("Tree endpoint not available");
			const response = await treeEndpoint.$get(
				{
					query: {},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = (await response.json()) as {
				data?: { income?: unknown; expense?: unknown };
			};
			expect(result.data).toHaveProperty("income");
			expect(result.data).toHaveProperty("expense");
		});

		test("should filter tree by type", async () => {
			const treeEndpoint = client.money.categories.tree;
			if (!treeEndpoint || !treeEndpoint.$get)
				throw new Error("Tree endpoint not available");
			const response = await treeEndpoint.$get(
				{
					query: {
						type: "expense",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = (await response.json()) as {
				data?: { expense?: unknown };
			};
			expect(result.data).toHaveProperty("expense");
		});
	});

	describe("GET /money/categories/:id", () => {
		test("should return a single category by id", async () => {
			const categoryId = createdCategoryIds[0];
			if (!categoryId) throw new Error("No category created");

			const response = await client.money.categories[":id"].$get(
				{
					param: { id: categoryId },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data).toHaveProperty("id");
			expect(result.data?.id).toBe(categoryId);
			expect(result.data).toHaveProperty("name");
			expect(result.data).toHaveProperty("type");
			expect(result.data).toHaveProperty("isActive");
		});

		test("should return 404 for non-existent category", async () => {
			const response = await client.money.categories[":id"].$get(
				{
					param: { id: "non-existent-id" },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});

		test("should fail without authentication", async () => {
			const categoryId = createdCategoryIds[0];
			if (!categoryId) throw new Error("No category created");

			const response = await client.money.categories[":id"].$get({
				param: { id: categoryId },
			});

			expect([401, 500]).toContain(response.status);
		});

		test("should not return another user's category", async () => {
			// Create a second test user
			const secondUser = await createUserForTesting({
				name: "Second Money Test User",
				username: `money-categories-test-other-${Date.now()}`,
				permissions: [],
			});

			const categoryId = createdCategoryIds[0];
			if (!categoryId) throw new Error("No category created");

			const response = await client.money.categories[":id"].$get(
				{
					param: { id: categoryId },
				},
				{
					headers: {
						Authorization: `Bearer ${secondUser.accessToken}`,
					},
				},
			);

			// Should return 404 because the category doesn't belong to this user
			expect(response.status).toBe(404);

			// Cleanup second user
			await cleanupTestUser(secondUser.user.id);
		});
	});

	describe("PUT /money/categories/:id", () => {
		test("should update category name", async () => {
			const categoryId = createdCategoryIds[0];
			if (!categoryId) throw new Error("No category created");

			const response = await client.money.categories[":id"].$put(
				{
					param: { id: categoryId },
					json: {
						name: "Updated Food Category",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data?.name).toBe("Updated Food Category");
		});

		test("should update category color and icon", async () => {
			const categoryId = createdCategoryIds[0];
			if (!categoryId) throw new Error("No category created");

			const response = await client.money.categories[":id"].$put(
				{
					param: { id: categoryId },
					json: {
						color: "#0000FF",
						icon: "hamburger",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data?.color).toBe("#0000FF");
			expect(result.data?.icon).toBe("hamburger");
		});

		test("should fail when setting self as parent", async () => {
			const categoryId = createdCategoryIds[0];
			if (!categoryId) throw new Error("No category created");

			const response = await client.money.categories[":id"].$put(
				{
					param: { id: categoryId },
					json: {
						parentId: categoryId,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(400);
		});

		test("should return 404 for non-existent category", async () => {
			const response = await client.money.categories[":id"].$put(
				{
					param: { id: "non-existent-id" },
					json: {
						name: "Updated Name",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /money/categories/:id", () => {
		test("should soft delete a category", async () => {
			// Create a category to delete
			const createResponse = await client.money.categories.$post(
				{
					json: {
						name: "To Be Deleted",
						type: "expense",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			const createResult = await createResponse.json();
			const categoryId = createResult.data?.id;
			if (!categoryId) throw new Error("Failed to create category");

			const response = await client.money.categories[":id"].$delete(
				{
					param: { id: categoryId },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.message).toBe("Category deleted successfully");

			// Verify it's soft deleted
			const category = await db.query.moneyCategories.findFirst({
				where: eq(moneyCategories.id, categoryId),
			});
			expect(category?.isActive).toBe(false);

			// Cleanup
			await db
				.delete(moneyCategories)
				.where(eq(moneyCategories.id, categoryId));
		});

		test("should fail when category has active children", async () => {
			// Use the parent category we created (Transportation)
			const parentCategory = await db.query.moneyCategories.findFirst({
				where: eq(moneyCategories.name, "Transportation"),
			});

			if (parentCategory) {
				const response = await client.money.categories[":id"].$delete(
					{
						param: { id: parentCategory.id },
					},
					{
						headers: {
							Authorization: `Bearer ${testUser.accessToken}`,
						},
					},
				);

				expect(response.status).toBe(400);
			}
		});

		test("should return 404 for non-existent category", async () => {
			const response = await client.money.categories[":id"].$delete(
				{
					param: { id: "non-existent-id" },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});
	});
});
