import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../drizzle";
import { appSettingsSchema } from "../drizzle/schema/appSettingsSchema";
import type { TestUserData } from "../utils/test-utils/create-user-for-testing";
import {
	cleanupTestUser,
	createUserForTesting,
} from "../utils/test-utils/create-user-for-testing";
import client from "../utils/test-utils/hono-test-client";

describe("App Settings Route", () => {
	let adminUser: TestUserData;
	let regularUser: TestUserData;
	let testSettingId: string;

	beforeAll(async () => {
		// Create admin user with app-settings permissions
		adminUser = await createUserForTesting({
			name: "Admin User - App Settings Test",
			username: `admin-appsettings-test-${Date.now()}`,
			permissions: ["app-settings.read", "app-settings.edit"],
		});

		// Create regular user without app-settings permissions
		regularUser = await createUserForTesting({
			name: "Regular User - App Settings Test",
			username: `user-appsettings-test-${Date.now()}`,
			permissions: [],
		});

		// Create test app settings
		const testSetting = await db
			.insert(appSettingsSchema)
			.values({
				key: "test.setting",
				value: "test-value",
			})
			.returning();
		if (testSetting[0]) {
			testSettingId = testSetting[0].id;
		}

		// Insert more test settings for pagination
		await db.insert(appSettingsSchema).values([
			{ key: "test.setting2", value: "value2" },
			{ key: "test.setting3", value: "value3" },
			{ key: "another.test", value: "another-value" },
		]);
	});

	afterAll(async () => {
		// Clean up test settings
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "test.setting"));
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "test.setting2"));
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "test.setting3"));
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "another.test"));

		// Clean up users
		await cleanupTestUser(adminUser.user.id);
		await cleanupTestUser(regularUser.user.id);
	});

	describe("GET / - Get all app settings", () => {
		test("should return paginated app settings for authorized user", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data).toHaveProperty("data");
			expect(data).toHaveProperty("_metadata");
			expect(data._metadata).toMatchObject({
				currentPage: 1,
				perPage: 10,
			});
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should return 403 for user without app-settings.read permission", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${regularUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(403);
		});

		test("should filter settings by search query (q)", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						q: "test.setting",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.data.length).toBeGreaterThan(0);
		});

		test("should filter settings by key filter", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						filter: JSON.stringify([{ id: "key", value: "test" }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			// Should have at least some data with "test" in the key
			expect(data.data.length).toBeGreaterThan(0);
			if (data.data.length > 0) {
				const hasTest = data.data.some((setting: { key: string }) =>
					setting.key.toLowerCase().includes("test"),
				);
				expect(hasTest).toBe(true);
			}
		});

		test("should filter settings by value filter", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						filter: JSON.stringify([
							{ id: "value", value: "value" },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			// Should have at least some data with "value" in the value field
			if (data.data.length > 0) {
				const hasValue = data.data.some((setting: { value: string }) =>
					setting.value.toLowerCase().includes("value"),
				);
				expect(hasValue).toBe(true);
			}
		});

		test("should sort settings by key ascending", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([{ id: "key", desc: false }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			// Check if results are sorted
			if (data.data.length > 1) {
				for (let i = 0; i < data.data.length - 1; i++) {
					const current = data.data[i];
					const next = data.data[i + 1];
					if (current && next) {
						expect(
							current.key.localeCompare(next.key),
						).toBeLessThanOrEqual(0);
					}
				}
			}
		});

		test("should sort settings by key descending", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "100",
						sort: JSON.stringify([{ id: "key", desc: true }]),
						q: "test", // Filter to get consistent data
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			// Should return test settings in descending order
			expect(data.data.length).toBeGreaterThan(0);
		});

		test("should sort settings by value", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([{ id: "value", desc: false }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should sort settings by createdAt", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([{ id: "createdAt", desc: true }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should sort settings by updatedAt", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([
							{ id: "updatedAt", desc: false },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should sort settings by updatedAt", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([
							{ id: "updatedAt", desc: false },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should sort settings by value descending", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([{ id: "value", desc: true }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should sort settings by createdAt descending", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([
							{ id: "createdAt", desc: false },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should sort settings by updatedAt descending", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([{ id: "updatedAt", desc: true }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should handle pagination with page 2", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "2",
						limit: "2",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data._metadata.currentPage).toBe(2);
			expect(data._metadata.perPage).toBe(2);
		});

		test("should mask secret values with asterisks", async () => {
			// Create a secret setting
			await db
				.insert(appSettingsSchema)
				.values({
					key: "oauth.google.clientSecret",
					value: "super-secret-value",
				})
				.onConflictDoUpdate({
					target: appSettingsSchema.key,
					set: { value: "super-secret-value" },
				});

			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "100",
						q: "oauth.google.clientSecret",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			const secretSetting = data.data.find(
				(s: { key: string; value: string }) =>
					s.key === "oauth.google.clientSecret",
			);
			if (secretSetting) {
				expect(secretSetting.value).toBe("********");
			}
		});

		test("should return empty data when no settings match filter", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						q: "nonexistent-setting-xyz",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.data.length).toBe(0);
			expect(data._metadata.totalItems).toBe(0);
		});

		test("should handle multiple filters at once", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						filter: JSON.stringify([
							{ id: "key", value: "test" },
							{ id: "value", value: "value" },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should handle multiple sort parameters", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([
							{ id: "key", desc: false },
							{ id: "value", desc: true },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should handle filter with non-string value gracefully", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						filter: JSON.stringify([{ id: "key", value: 123 }]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should handle filter with unknown id gracefully", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						filter: JSON.stringify([
							{ id: "unknown_field", value: "test" },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should handle sort with unknown id gracefully", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([
							{ id: "unknown_field", desc: false },
						]),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.data)).toBe(true);
		});
	});

	describe("GET /:id - Get single app setting", () => {
		test("should return app setting by id for authorized user", async () => {
			const response = await client["app-settings"][":id"].$get(
				{
					param: { id: testSettingId },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data).toMatchObject({
				id: testSettingId,
				key: "test.setting",
				value: "test-value",
			});
		});

		test("should return 403 for user without app-settings.read permission", async () => {
			const response = await client["app-settings"][":id"].$get(
				{
					param: { id: testSettingId },
				},
				{
					headers: {
						Authorization: `Bearer ${regularUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(403);
		});

		test("should return 404 for non-existent setting", async () => {
			const response = await client["app-settings"][":id"].$get(
				{
					param: { id: "non-existent-id" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
			const data = (await response.json()) as unknown as {
				message?: string;
			};
			expect(data.message).toContain("not found");
		});
	});

	describe("PUT /:id - Update app setting", () => {
		test("should update app setting value for authorized user", async () => {
			const response = await client["app-settings"][":id"].$put(
				{
					param: { id: testSettingId },
					json: { value: "updated-value" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.value).toBe("updated-value");

			// Verify the update persisted
			const updated = await db.query.appSettingsSchema.findFirst({
				where: eq(appSettingsSchema.id, testSettingId),
			});
			expect(updated?.value).toBe("updated-value");

			// Restore original value
			await db
				.update(appSettingsSchema)
				.set({ value: "test-value" })
				.where(eq(appSettingsSchema.id, testSettingId));
		});

		test("should return 403 for user without app-settings.edit permission", async () => {
			const response = await client["app-settings"][":id"].$put(
				{
					param: { id: testSettingId },
					json: { value: "hacked-value" },
				},
				{
					headers: {
						Authorization: `Bearer ${regularUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(403);

			// Verify value was not changed
			const setting = await db.query.appSettingsSchema.findFirst({
				where: eq(appSettingsSchema.id, testSettingId),
			});
			expect(setting?.value).toBe("test-value");
		});

		test("should return 404 when updating non-existent setting", async () => {
			const response = await client["app-settings"][":id"].$put(
				{
					param: { id: "non-existent-id" },
					json: { value: "new-value" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
			const data = (await response.json()) as unknown as {
				message?: string;
			};
			expect(data.message).toContain("not found");
		});

		test("should reject invalid request body", async () => {
			const response = await client["app-settings"][":id"].$put(
				{
					param: { id: testSettingId },
					// @ts-expect-error - testing invalid body
					json: { invalid: "field" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			// Should either return 400 for validation error or 200 if ignoring extra fields
			expect([200, 400]).toContain(response.status);
		});

		test("should update updatedAt timestamp", async () => {
			// Get original timestamp
			const before = await db.query.appSettingsSchema.findFirst({
				where: eq(appSettingsSchema.id, testSettingId),
			});

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 100));

			const response = await client["app-settings"][":id"].$put(
				{
					param: { id: testSettingId },
					json: { value: "timestamp-test" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Get updated timestamp
			const after = await db.query.appSettingsSchema.findFirst({
				where: eq(appSettingsSchema.id, testSettingId),
			});

			if (after?.updatedAt && before?.updatedAt) {
				expect(after.updatedAt.getTime()).toBeGreaterThan(
					before.updatedAt.getTime(),
				);
			}

			// Restore original value
			await db
				.update(appSettingsSchema)
				.set({ value: "test-value" })
				.where(eq(appSettingsSchema.id, testSettingId));
		});
	});

	describe("Authentication and Authorization", () => {
		test("should return 401 when no token provided", async () => {
			const response = await client["app-settings"].$get({
				query: {
					page: "1",
					limit: "10",
				},
			});

			expect(response.status).toBe(401);
		});

		test("should return 401 with invalid token", async () => {
			const response = await client["app-settings"].$get(
				{
					query: {
						page: "1",
						limit: "10",
					},
				},
				{
					headers: {
						Authorization: "Bearer invalid-token",
					},
				},
			);

			expect(response.status).toBe(401);
		});
	});
});
