import { beforeAll, describe, test, expect, mock, afterAll } from "bun:test";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { hashPassword } from "../../utils/passwordUtils";
import app from "../../index"; // Corrected import for the app's fetch method
import { eq } from "drizzle-orm";
import appEnv from "../../appEnv";
import client from "../../utils/honoTestClient"; // Added import

// Mock getAppSettingValue
mock.module("../../services/appSettings/appSettingServices", () => ({
	getAppSettingValue: mock(async (key: string) => {
		if (key === "login.usernameAndPassword.enabled") {
			return true;
		}
		return undefined; // Default mock behavior
	}),
}));

describe("Auth Routes", () => {
	let testUser: typeof users.$inferSelect;
	const testPassword = "V7d#rL9p@Wq3zMf1";

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
	});

	afterAll(async () => {
		await db
			.delete(users)
			.where(eq(users.username, "_test_user_login_test"));
	});

	test("Should able to login successfully on correct credentials", async () => {
		const res = await client.auth.login.$post({
			// Changed to use testClient
			json: {
				// Body is now under 'json' property
				username: testUser.username,
				password: testPassword,
			},
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("accessToken");
		expect(body.user.id).toBe(testUser.id);
		expect(body.user.name).toBe(testUser.name);
		expect(body.user.permissions).toBeArray();
		expect(body.user.roles).toBeArray();
	});

	test("Should able to login successfully on correct credentials with different case for username", async () => {
		const res = await client.auth.login.$post({
			// Changed to use testClient
			json: {
				username: testUser.username.toUpperCase(), // Use uppercase username
				password: testPassword,
			},
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("accessToken");
		expect(body.user.id).toBe(testUser.id);
	});

	test("Should able to login successfully on correct credentials with different case for email", async () => {
		// First, ensure the test user has an email for this test
		if (!testUser.email) {
			throw new Error(
				"Test user does not have an email for case-insensitive email login test.",
			);
		}
		const res = await client.auth.login.$post({
			// Changed to use testClient
			json: {
				username: testUser.email.toUpperCase(), // Use uppercase email as username
				password: testPassword,
			},
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("accessToken");
		expect(body.user.id).toBe(testUser.id);
	});

	test("Should not able to login on incorrect credentials", async () => {
		const res = await client.auth.login.$post({
			// Changed to use testClient
			json: {
				username: testUser.username,
				password: "wrongpassword",
			},
		});

		expect(res.status).toBe(400);
		const body = await res.json();
		// expect(body.errorCode).toBe("INVALID_CREDENTIALS");
	});

	test.todo(
		"Should not able to login if username and password login is disabled",
	);

	test.todo("Should not able to login if rate limit is exceeded");
});
