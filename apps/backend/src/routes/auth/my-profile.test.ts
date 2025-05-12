import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { hashPassword } from "../../utils/passwordUtils";
import client from "../../utils/honoTestClient";

describe("My Profile Route", () => {
	let testUser: typeof users.$inferSelect;
	const testPassword = "V7d#rL9p@Wq3zMf1";
	let accessToken: string;

	beforeAll(async () => {
		// Clean up existing test user if any
		await db
			.delete(users)
			.where(eq(users.username, "_test_user_login_test"));

		const hashedPassword = await hashPassword(testPassword);
		const result = await db
			.insert(users)
			.values({
				name: "_test_user_login_test",
				username: "_test_user_login_test",
				email: "_test_user_login_test@example.com",
				password: hashedPassword,
				isEnabled: true,
			})
			.returning();
		if (!result || result.length === 0) {
			throw new Error("Failed to create test user for login tests.");
		}
		testUser = result[0] as typeof users.$inferSelect; // Added type assertion

		// Login to get access token
		const loginRes = await client.auth.login.$post({
			json: {
				username: testUser.username,
				password: testPassword,
			},
		});
		const loginBody = await loginRes.json();
		accessToken = loginBody.accessToken;
	});

	afterAll(async () => {
		await db
			.delete(users)
			.where(eq(users.username, "_test_user_login_test"));
	});

	test("Should able to get my profile successfully", async () => {
		const res = await client.auth["my-profile"].$get(
			{},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("id", testUser.id);
		expect(body).toHaveProperty("name", testUser.name);
		expect(body).toHaveProperty("permissions");
		expect(body).toHaveProperty("roles");
	});

	test("Should not able to get my profile if not authenticated", async () => {
		const res = await client.auth["my-profile"].$get();
		expect(res.status).toBe(401);
		const body = (await res.json()) as unknown as { errorCode: string };
		expect(body.errorCode).toBe("UNAUTHORIZED");
	});

	test("Should not able to get my profile if user is not found", async () => {
		// Delete the user
		await db.delete(users).where(eq(users.id, testUser.id));
		const res = await client.auth["my-profile"].$get(
			{},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);
		expect(res.status).toBe(401);
		const body = (await res.json()) as unknown as { errorCode: string };
		expect(body.errorCode).toBe("UNAUTHORIZED");
		// Recreate user for other tests
		const hashedPassword = await hashPassword(testPassword);
		const result = await db
			.insert(users)
			.values({
				id: testUser.id,
				name: testUser.name,
				username: testUser.username,
				email: testUser.email,
				password: hashedPassword,
				isEnabled: true,
			})
			.returning();
		if (!result || result.length === 0) {
			throw new Error("Failed to recreate test user after deletion.");
		}
	});

	test("Should not able to get my profile if user is not enabled", async () => {
		await db
			.update(users)
			.set({ isEnabled: false })
			.where(eq(users.id, testUser.id));
		const res = await client.auth["my-profile"].$get(
			{},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);
		expect(res.status).toBe(401);
		const body = (await res.json()) as unknown as { errorCode: string };
		expect(body.errorCode).toBe("UNAUTHORIZED");
		// Re-enable user for other tests
		await db
			.update(users)
			.set({ isEnabled: true })
			.where(eq(users.id, testUser.id));
	});

	test("Should not able to get my profile if user is deleted", async () => {
		await db
			.update(users)
			.set({ deletedAt: new Date() })
			.where(eq(users.id, testUser.id));
		const res = await client.auth["my-profile"].$get(
			{},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);
		expect(res.status).toBe(401);
		const body = (await res.json()) as unknown as { errorCode: string };
		expect(body.errorCode).toBe("UNAUTHORIZED");
		// Restore user for other tests
		await db
			.update(users)
			.set({ deletedAt: null })
			.where(eq(users.id, testUser.id));
	});
});
