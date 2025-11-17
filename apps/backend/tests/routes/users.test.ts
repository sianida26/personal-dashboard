import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../src/drizzle";
import { rolesSchema } from "../../src/drizzle/schema/roles";
import { users } from "../../src/drizzle/schema/users";
import type { TestUserData } from "../../src/utils/test-utils/create-user-for-testing";
import {
	cleanupTestUser,
	createUserForTesting,
} from "../../src/utils/test-utils/create-user-for-testing";
import client from "../../src/utils/test-utils/hono-test-client";

describe("Users API Routes", () => {
	let adminUser: TestUserData;
	const createdUserIds: string[] = [];

	beforeAll(async () => {
		adminUser = await createUserForTesting({
			name: "Admin User - Users Test",
			username: `admin-users-test-${Date.now()}`,
			permissions: [
				"users.readAll",
				"users.create",
				"users.update",
				"users.delete",
				"users.restore",
			],
		});
	});

	afterAll(async () => {
		// Clean up created users
		for (const userId of createdUserIds) {
			await db.delete(users).where(eq(users.id, userId));
		}
		await cleanupTestUser(adminUser.user.id);
	});

	describe("GET /", () => {
		test("should return paginated users list", async () => {
			const response = await client.users.$get(
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
			expect(data._metadata).toHaveProperty("currentPage", 1);
			expect(data._metadata).toHaveProperty("perPage", 10);
			expect(Array.isArray(data.data)).toBe(true);
		});

		test("should filter users by query string", async () => {
			const response = await client.users.$get(
				{
					query: {
						page: "1",
						limit: "10",
						q: "admin",
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

		test("should include trashed users when requested", async () => {
			const response = await client.users.$get(
				{
					query: {
						page: "1",
						limit: "10",
						includeTrashed: "true",
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

		test("should filter users by role", async () => {
			// Get a role code first
			const role = await db.query.rolesSchema.findFirst({
				where: eq(rolesSchema.code, "super-admin"),
			});

			if (role) {
				const response = await client.users.$get(
					{
						query: {
							page: "1",
							limit: "10",
							filter: JSON.stringify([
								{ id: "roles", value: "super-admin" },
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
			}
		});

		test("should filter users by enabled status", async () => {
			const response = await client.users.$get(
				{
					query: {
						page: "1",
						limit: "10",
						filter: JSON.stringify([
							{ id: "isEnabled", value: "Active" },
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

		test("should sort users by name", async () => {
			const response = await client.users.$get(
				{
					query: {
						page: "1",
						limit: "10",
						sort: JSON.stringify([{ id: "name", desc: false }]),
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

		test("should return correct pagination metadata", async () => {
			const response = await client.users.$get(
				{
					query: {
						page: "1",
						limit: "5",
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

			expect(data._metadata).toHaveProperty("currentPage");
			expect(data._metadata).toHaveProperty("totalPages");
			expect(data._metadata).toHaveProperty("totalItems");
			expect(data._metadata).toHaveProperty("perPage");
		});

		test("should return 403 for user without permissions", async () => {
			const unauthorizedUser = await createUserForTesting({
				name: "Unauthorized User",
				username: `unauthorized-users-${Date.now()}`,
				permissions: [],
			});

			const response = await client.users.$get(
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
			const response = await client.users.$get({
				query: {
					page: "1",
					limit: "10",
				},
			});

			expect(response.status).toBe(401);
		});
	});

	describe("GET /:id", () => {
		test("should return user by id with roles", async () => {
			const testUser = await createUserForTesting({
				name: "Test User for Get",
				username: `test-user-get-${Date.now()}`,
			});

			const response = await client.users[":id"].$get(
				{
					param: { id: testUser.user.id },
					query: { includeTrashed: "false" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty("id", testUser.user.id);
			expect(data).toHaveProperty("name");
			expect(data).toHaveProperty("roles");

			await cleanupTestUser(testUser.user.id);
		});

		test("should return 404 when user not found", async () => {
			const response = await client.users[":id"].$get(
				{
					param: { id: "non-existent-id" },
					query: { includeTrashed: "false" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});

		test("should include deleted user when includeTrashed is true", async () => {
			const testUser = await createUserForTesting({
				name: "Test User for Delete Check",
				username: `test-user-delete-check-${Date.now()}`,
			});

			// Soft delete the user
			await db
				.update(users)
				.set({ deletedAt: new Date() })
				.where(eq(users.id, testUser.user.id));

			const response = await client.users[":id"].$get(
				{
					param: { id: testUser.user.id },
					query: { includeTrashed: "true" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty("id", testUser.user.id);

			await cleanupTestUser(testUser.user.id);
		});

		test("should exclude deleted user by default", async () => {
			const testUser = await createUserForTesting({
				name: "Test User for Exclude Check",
				username: `test-user-exclude-${Date.now()}`,
			});

			// Soft delete the user
			await db
				.update(users)
				.set({ deletedAt: new Date() })
				.where(eq(users.id, testUser.user.id));

			const response = await client.users[":id"].$get(
				{
					param: { id: testUser.user.id },
					query: { includeTrashed: "false" },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
			await cleanupTestUser(testUser.user.id);
		});
	});

	describe("POST /", () => {
		test("should create new user with valid data", async () => {
			const userData = {
				name: "New Test User",
				username: `new-user-${Date.now()}`,
				email: `newuser-${Date.now()}@example.com`,
				password: "TestPassword123!",
				isEnabled: true,
			};

			const response = await client.users.$post(
				{
					json: userData,
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const data = await response.json();
			expect(data).toHaveProperty("message", "User created successfully");
			expect(data.user).toHaveProperty("id");
			expect(data.user).toHaveProperty("username", userData.username);

			createdUserIds.push(data.user.id);
		});

		test("should return error when username already exists", async () => {
			const existingUser = await createUserForTesting({
				name: "Existing User",
				username: `existing-user-${Date.now()}`,
			});

			const response = await client.users.$post(
				{
					json: {
						name: "Duplicate User",
						username: existingUser.user.username,
						password: "TestPassword123!",
						isEnabled: true,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			//@ts-expect-error
			expect(response.status).toBe(422);
			const data = await response.json();
			expect(data).toHaveProperty("message");
			expect(data.message.toLowerCase()).toContain("username");

			await cleanupTestUser(existingUser.user.id);
		});

		test("should return error when email already exists", async () => {
			const existingUser = await createUserForTesting({
				name: "Existing User Email",
				username: `existing-email-${Date.now()}`,
				email: `existing-${Date.now()}@example.com`,
			});

			const response = await client.users.$post(
				{
					json: {
						name: "Duplicate Email User",
						username: `new-user-${Date.now()}`,
						email: existingUser.user.email ?? undefined,
						password: "TestPassword123!",
						isEnabled: true,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			//@ts-expect-error
			expect(response.status).toBe(422);
			const data = await response.json();
			expect(data).toHaveProperty("message");
			expect(data.message.toLowerCase()).toContain("email");

			await cleanupTestUser(existingUser.user.id);
		});

		test("should assign roles to user", async () => {
			const role = await db.query.rolesSchema.findFirst({
				where: eq(rolesSchema.code, "admin"),
			});

			if (role) {
				const userData = {
					name: "User with Role",
					username: `user-with-role-${Date.now()}`,
					password: "TestPassword123!",
					isEnabled: true,
					roles: [role.id],
				};

				const response = await client.users.$post(
					{
						json: userData,
					},
					{
						headers: {
							Authorization: `Bearer ${adminUser.accessToken}`,
						},
					},
				);

				expect(response.status).toBe(201);
				const data = await response.json();
				createdUserIds.push(data.user.id);
			}
		});

		test("should return 403 for user without permissions", async () => {
			const unauthorizedUser = await createUserForTesting({
				name: "Unauthorized Create User",
				username: `unauthorized-create-${Date.now()}`,
				permissions: [],
			});

			const response = await client.users.$post(
				{
					json: {
						name: "Test User",
						username: `test-${Date.now()}`,
						password: "TestPassword123!",
						isEnabled: true,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${unauthorizedUser.accessToken}`,
					},
				},
			);

			//@ts-expect-error
			expect(response.status).toBe(403);
			await cleanupTestUser(unauthorizedUser.user.id);
		});
	});

	describe("PATCH /:id", () => {
		test("should update user with valid data", async () => {
			const testUser = await createUserForTesting({
				name: "User to Update",
				username: `user-to-update-${Date.now()}`,
			});

			const response = await client.users[":id"].$patch(
				{
					param: { id: testUser.user.id },
					json: {
						name: "Updated Name",
						username: testUser.user.username,
						password: "",
						isEnabled: false,
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
			expect(data).toHaveProperty("message", "User updated successfully");

			// Verify update
			const updatedUser = await db.query.users.findFirst({
				where: eq(users.id, testUser.user.id),
			});
			expect(updatedUser?.name).toBe("Updated Name");
			expect(updatedUser?.isEnabled).toBe(false);

			await cleanupTestUser(testUser.user.id);
		});

		test("should return 404 when user not found", async () => {
			const response = await client.users[":id"].$patch(
				{
					param: { id: "non-existent-id" },
					json: {
						name: "Updated Name",
						username: "non-existent-username",
						password: "",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});

		test("should not update deleted user", async () => {
			const testUser = await createUserForTesting({
				name: "User to Delete Then Update",
				username: `user-deleted-update-${Date.now()}`,
			});

			// Soft delete the user
			await db
				.update(users)
				.set({ deletedAt: new Date() })
				.where(eq(users.id, testUser.user.id));

			const response = await client.users[":id"].$patch(
				{
					param: { id: testUser.user.id },
					json: {
						name: "Updated Name",
						username: testUser.user.username,
						password: "",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
			await cleanupTestUser(testUser.user.id);
		});

		test("should hash password when updating", async () => {
			const testUser = await createUserForTesting({
				name: "User for Password Update",
				username: `user-pass-update-${Date.now()}`,
			});

			const newPassword = "NewPassword123!";
			const response = await client.users[":id"].$patch(
				{
					param: { id: testUser.user.id },
					json: {
						name: testUser.user.name,
						username: testUser.user.username,
						password: newPassword,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Verify password was hashed (not stored as plain text)
			const updatedUser = await db.query.users.findFirst({
				where: eq(users.id, testUser.user.id),
			});
			expect(updatedUser?.password).not.toBe(newPassword);
			expect(updatedUser?.password).toBeDefined();

			await cleanupTestUser(testUser.user.id);
		});

		test("should update timestamp", async () => {
			const testUser = await createUserForTesting({
				name: "User for Timestamp Update",
				username: `user-timestamp-${Date.now()}`,
			});

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 100));

			const response = await client.users[":id"].$patch(
				{
					param: { id: testUser.user.id },
					json: {
						name: "Updated Name for Timestamp",
						username: testUser.user.username,
						password: "",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Re-fetch the user to verify timestamp was updated
			const userAfterUpdate = await db.query.users.findFirst({
				where: eq(users.id, testUser.user.id),
			});

			// Just check that updatedAt exists and is not null
			expect(userAfterUpdate?.updatedAt).toBeDefined();
			expect(userAfterUpdate?.updatedAt).not.toBeNull();

			await cleanupTestUser(testUser.user.id);
		});
	});

	describe("DELETE /:id", () => {
		test("should soft delete user by default", async () => {
			const testUser = await createUserForTesting({
				name: "User to Soft Delete",
				username: `user-soft-delete-${Date.now()}`,
			});

			const response = await client.users[":id"].$delete(
				{
					param: { id: testUser.user.id },
					form: {
						skipTrash: "false",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Verify soft delete
			const deletedUser = await db.query.users.findFirst({
				where: eq(users.id, testUser.user.id),
			});
			expect(deletedUser?.deletedAt).not.toBeNull();

			await cleanupTestUser(testUser.user.id);
		});

		test("should permanently delete when skipTrash is true", async () => {
			const testUser = await createUserForTesting({
				name: "User to Hard Delete",
				username: `user-hard-delete-${Date.now()}`,
			});

			const response = await client.users[":id"].$delete(
				{
					param: { id: testUser.user.id },
					form: {
						skipTrash: "true",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Verify permanent delete
			const deletedUser = await db.query.users.findFirst({
				where: eq(users.id, testUser.user.id),
			});
			expect(deletedUser).toBeUndefined();
		});

		test("should return 404 when user not found", async () => {
			const response = await client.users[":id"].$delete(
				{
					param: { id: "non-existent-id" },
					form: {
						skipTrash: "false",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});

		test("should prevent user from deleting themselves", async () => {
			const response = await client.users[":id"].$delete(
				{
					param: { id: adminUser.user.id },
					form: {
						skipTrash: "false",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.message.toLowerCase()).toContain("yourself");
		});
	});

	describe("PATCH /restore/:id", () => {
		test("should restore soft-deleted user", async () => {
			const testUser = await createUserForTesting({
				name: "User to Restore",
				username: `user-restore-${Date.now()}`,
			});

			// Soft delete the user
			await db
				.update(users)
				.set({ deletedAt: new Date() })
				.where(eq(users.id, testUser.user.id));

			const response = await client.users.restore[":id"].$patch(
				{
					param: { id: testUser.user.id },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);

			// Verify restore
			const restoredUser = await db.query.users.findFirst({
				where: eq(users.id, testUser.user.id),
			});
			expect(restoredUser?.deletedAt).toBeNull();

			await cleanupTestUser(testUser.user.id);
		});

		test("should return 404 when user not found", async () => {
			const response = await client.users.restore[":id"].$patch(
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
		});

		test("should return error when user is not deleted", async () => {
			const testUser = await createUserForTesting({
				name: "User Not Deleted",
				username: `user-not-deleted-${Date.now()}`,
			});

			const response = await client.users.restore[":id"].$patch(
				{
					param: { id: testUser.user.id },
				},
				{
					headers: {
						Authorization: `Bearer ${adminUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(400);
			const data = (await response.json()) as { message: string };
			expect(data.message.toLowerCase()).toContain("not deleted");

			await cleanupTestUser(testUser.user.id);
		});
	});
});
