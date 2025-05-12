import { beforeAll, describe, test, expect, mock, afterAll } from "bun:test";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { hashPassword } from "../../utils/passwordUtils";
import { eq } from "drizzle-orm";
import client from "../../utils/honoTestClient";

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
			json: {
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
			json: {
				username: testUser.username,
				password: "wrongpassword",
			},
		});

		expect(res.status).toBe(400);
		expect(res.ok).toBe(false);

		const body = (await res.json()) as unknown as {
			errorCode?: string;
		};

		expect(body.errorCode).toBe("INVALID_CREDENTIALS");
	});

	test("Should not able to login if username and password login is disabled", async () => {
		// Mock getAppSettingValue to return false for username and password login
		mock.module("../../services/appSettings/appSettingServices", () => ({
			getAppSettingValue: mock(async (key: string) => {
				if (key === "login.usernameAndPassword.enabled") {
					return false;
				}
				return undefined;
			}),
		}));

		const res = await client.auth.login.$post({
			json: {
				username: testUser.username,
				password: testPassword,
			},
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as unknown as {
			errorCode: string;
			message: string;
		};
		expect(body.errorCode).toBe("INVALID_CREDENTIALS");
		expect(body.message).toBe("Username and password login is disabled");

		// Reset the mock for other tests
		mock.module("../../services/appSettings/appSettingServices", () => ({
			getAppSettingValue: mock(async (key: string) => {
				if (key === "login.usernameAndPassword.enabled") {
					return true;
				}
				return undefined;
			}),
		}));
	});

	test("Should not able to login if rate limit is exceeded", async () => {
		// Make multiple requests to exceed the rate limit
		const requests = Array(16)
			.fill(null)
			.map(() =>
				client.auth.login.$post({
					json: {
						username: testUser.username,
						password: testPassword,
					},
				}),
			);

		// Wait for all requests to complete
		const responses = await Promise.all(requests);

		if (responses.length === 0) {
			throw new Error("No responses received from rate limit test");
		}
		const lastResponse = responses[responses.length - 1];
		if (!lastResponse) {
			throw new Error(
				"lastResponse is undefined, but responses.length > 0",
			);
		}
		expect(lastResponse.status).toBe(429);
		expect(lastResponse.headers.get("retry-after")).toBeDefined();
	});
});
