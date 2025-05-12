import { describe, test, expect, mock, beforeAll, afterAll } from "bun:test";
import client from "../../utils/honoTestClient";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../utils/passwordUtils";

// Helper to mock getAppSettingValue
const mockSettings = (settings: Record<string, string | undefined>) => {
	mock.module("../../services/appSettings/appSettingServices", () => ({
		getAppSettingValue: mock(async (key: string) => {
			return settings[key];
		}),
	}));
};

describe("GET /login-settings route", () => {
	let testUser: typeof users.$inferSelect;
	const testPassword = "V7d#rL9p@Wq3zMf1";
	let accessToken: string;

	beforeAll(async () => {
		await db
			.delete(users)
			.where(eq(users.username, "_test_user_login_settings"));
		const hashedPassword = await hashPassword(testPassword);
		const result = await db
			.insert(users)
			.values({
				name: "_test_user_login_settings",
				username: "_test_user_login_settings",
				email: "_test_user_login_settings@example.com",
				password: hashedPassword,
				isEnabled: true,
			})
			.returning();
		testUser = result[0] as typeof users.$inferSelect;
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
			.where(eq(users.username, "_test_user_login_settings"));
	});

	test("Should return the login settings", async () => {
		mockSettings({
			"login.usernameAndPassword.enabled": "true",
			"oauth.google.enabled": "true",
			"oauth.microsoft.enabled": "true",
		});
		const res = await client.auth["login-settings"].$get();
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({
			enableGoogleOAuth: true,
			enableMicrosoftOAuth: true,
			enableUsernameAndPasswordLogin: true,
		});
	});

	test("Should return 401 if the user is authenticated", async () => {
		mockSettings({
			"login.usernameAndPassword.enabled": "true",
			"oauth.google.enabled": "true",
			"oauth.microsoft.enabled": "true",
		});
		const res = await client.auth["login-settings"].$get(
			{},
			{ headers: { Authorization: `Bearer ${accessToken}` } },
		);
		expect(res.status).toBe(401);
		const body = (await res.json()) as unknown as { errorCode: string };
		expect(body.errorCode).toBe("UNAUTHORIZED");
	});

	test("Should return correct state of password based login", async () => {
		mockSettings({
			"login.usernameAndPassword.enabled": "true",
			"oauth.google.enabled": "false",
			"oauth.microsoft.enabled": "false",
		});
		let res = await client.auth["login-settings"].$get();
		let body = await res.json();
		expect(body.enableUsernameAndPasswordLogin).toBe(true);
		mockSettings({
			"login.usernameAndPassword.enabled": "false",
			"oauth.google.enabled": "false",
			"oauth.microsoft.enabled": "false",
		});
		res = await client.auth["login-settings"].$get();
		body = await res.json();
		expect(body.enableUsernameAndPasswordLogin).toBe(false);
	});

	test("Should return correct state of google oauth", async () => {
		mockSettings({
			"login.usernameAndPassword.enabled": "false",
			"oauth.google.enabled": "true",
			"oauth.microsoft.enabled": "false",
		});
		let res = await client.auth["login-settings"].$get();
		let body = await res.json();
		expect(body.enableGoogleOAuth).toBe(true);
		mockSettings({
			"login.usernameAndPassword.enabled": "false",
			"oauth.google.enabled": "false",
			"oauth.microsoft.enabled": "false",
		});
		res = await client.auth["login-settings"].$get();
		body = await res.json();
		expect(body.enableGoogleOAuth).toBe(false);
	});

	test("Should return correct state of microsoft oauth", async () => {
		mockSettings({
			"login.usernameAndPassword.enabled": "false",
			"oauth.google.enabled": "false",
			"oauth.microsoft.enabled": "true",
		});
		let res = await client.auth["login-settings"].$get();
		let body = await res.json();
		expect(body.enableMicrosoftOAuth).toBe(true);
		mockSettings({
			"login.usernameAndPassword.enabled": "false",
			"oauth.google.enabled": "false",
			"oauth.microsoft.enabled": "false",
		});
		res = await client.auth["login-settings"].$get();
		body = await res.json();
		expect(body.enableMicrosoftOAuth).toBe(false);
	});
});
