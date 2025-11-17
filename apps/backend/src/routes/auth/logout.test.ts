import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import client from "../../utils/honoTestClient";
import { hashPassword } from "../../utils/passwordUtils";

describe("Logout Route", () => {
	let testUser: typeof users.$inferSelect;
	const testPassword = "V7d#rL9p@Wq3zMf1";
	let accessToken: string;
	let refreshToken: string;

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
		refreshToken = loginBody.refreshToken;
	});

	afterAll(async () => {
		await db
			.delete(users)
			.where(eq(users.username, "_test_user_login_test"));
	});

	test("Should able to logout successfully", async () => {
		const res = await client.auth.logout.$post(
			{
				json: { refreshToken },
			},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);
		expect(res.status).toBe(200);
	});

	test("Should not able to logout if user is not authenticated", async () => {
		const res = await client.auth.logout.$post({
			json: { refreshToken: "invalid" },
		});
		expect(res.status).toBe(401);
	});

	test("Should invalidate the access token", async () => {
		// TODO: Implement this test
	});
});
