import { beforeAll, describe, test, expect, mock, afterAll } from "bun:test";
import db from "../../../drizzle";
import { users } from "../../../drizzle/schema/users";
import { oauthGoogle } from "../../../drizzle/schema/oauthGoogle";
import { appSettingsSchema } from "../../../drizzle/schema/appSettingsSchema";
import { permissionsToUsers } from "../../../drizzle/schema/permissionsToUsers";
import { rolesToUsers } from "../../../drizzle/schema/rolesToUsers";
import { eq } from "drizzle-orm";
import client from "../../../utils/honoTestClient";
import { createId } from "@paralleldrive/cuid2";
import type { AppSettingKey } from "@repo/data";
import type { Context, Next } from "hono";

describe("Google OAuth Routes - Integration Tests", () => {
	let testUserId: string;

	beforeAll(async () => {
		// Set up app settings
		await db
			.insert(appSettingsSchema)
			.values({
				key: "oauth.google.enabled",
				value: "true",
			})
			.onConflictDoUpdate({
				target: appSettingsSchema.key,
				set: { value: "true" },
			});

		await db
			.insert(appSettingsSchema)
			.values({
				key: "oauth.google.clientId",
				value: "test-client-id",
			})
			.onConflictDoUpdate({
				target: appSettingsSchema.key,
				set: { value: "test-client-id" },
			});

		await db
			.insert(appSettingsSchema)
			.values({
				key: "oauth.google.clientSecret",
				value: "test-client-secret",
			})
			.onConflictDoUpdate({
				target: appSettingsSchema.key,
				set: { value: "test-client-secret" },
			});
	});

	afterAll(async () => {
		// Clean up test data
		if (testUserId) {
			await db
				.delete(rolesToUsers)
				.where(eq(rolesToUsers.userId, testUserId));
			await db
				.delete(permissionsToUsers)
				.where(eq(permissionsToUsers.userId, testUserId));
			await db
				.delete(oauthGoogle)
				.where(eq(oauthGoogle.userId, testUserId));
			await db.delete(users).where(eq(users.id, testUserId));
		}

		// Clean up app settings
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "oauth.google.enabled"));
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "oauth.google.clientId"));
		await db
			.delete(appSettingsSchema)
			.where(eq(appSettingsSchema.key, "oauth.google.clientSecret"));
	});

	describe("User authentication flow", () => {
		test("should create user and complete full OAuth flow", async () => {
			// Mock Google OAuth provider
			const mockGoogleUser = {
				id: "google-integration-test-123",
				email: "integration-test@example.com",
				name: "Integration Test User",
				given_name: "Integration",
				family_name: "Test",
				picture: "https://example.com/avatar.jpg",
				locale: "en",
			};

			const mockToken = {
				token: "mock-integration-token",
				expires_in: 3600,
				refresh_token: "mock-refresh-token",
			};

			// Mock the app settings service
			mock.module(
				"../../../services/appSettings/appSettingServices",
				() => ({
					getAppSettingValue: mock(async (key: AppSettingKey) => {
						switch (key) {
							case "oauth.google.enabled":
								return true;
							case "oauth.google.clientId":
								return "test-client-id";
							case "oauth.google.clientSecret":
								return "test-client-secret";
							default:
								return undefined;
						}
					}),
				}),
			);

			// Mock the Google Auth middleware
			mock.module("@hono/oauth-providers/google", () => ({
				googleAuth: mock(() => {
					return mock(async (c: Context, next: Next) => {
						c.set("user-google", mockGoogleUser);
						c.set("token", mockToken);
						await next();
					});
				}),
			}));

			// Mock environment variables
			mock.module("../../../appEnv", () => ({
				default: {
					FRONTEND_URL: "http://localhost:3000",
				},
			}));

			// Mock JWT token generation

			// First, create the user through OAuth
			const authRes = await client.auth.google.$get();
			expect(authRes.status).toBe(302);

			// Get the created user
			const createdUser = await db.query.users.findFirst({
				where: eq(users.email, mockGoogleUser.email),
			});
			expect(createdUser).toBeDefined();
			if (createdUser) {
				testUserId = createdUser.id;
			}

			// Extract session ID and get auth data
			const location = authRes.headers.get("location");
			const sessionId = location?.split("session=")[1];
			expect(sessionId).toBeDefined();

			if (!sessionId) {
				throw new Error("Session ID not found in redirect URL");
			}

			const authDataRes = await client.auth.google["auth-data"][
				":sessionId"
			].$get({
				param: { sessionId },
			});

			expect(authDataRes.status).toBe(200);
			const authData = await authDataRes.json();

			// Verify auth data structure
			expect(authData).toHaveProperty("accessToken");
			expect(authData).toHaveProperty("user");
			expect(authData.user).toHaveProperty("id");
			expect(authData.user).toHaveProperty("name");
			expect(authData.user).toHaveProperty("permissions");
			expect(authData.user).toHaveProperty("roles");
			expect(authData.user.permissions).toBeArray();
			expect(authData.user.roles).toBeArray();
			expect(authData.user.name).toBe(mockGoogleUser.name);

			// Verify user was created correctly
			expect(createdUser?.username).toBe(mockGoogleUser.email);
			expect(createdUser?.email).toBe(mockGoogleUser.email);
			expect(createdUser?.name).toBe(mockGoogleUser.name);
			expect(createdUser?.isEnabled).toBe(true);

			// Verify Google OAuth account was linked
			const oauthAccount = await db.query.oauthGoogle.findFirst({
				where: eq(oauthGoogle.providerId, mockGoogleUser.id),
			});
			expect(oauthAccount).toBeDefined();
			expect(oauthAccount?.email).toBe(mockGoogleUser.email);
			expect(oauthAccount?.name).toBe(mockGoogleUser.name);
			expect(oauthAccount?.givenName).toBe(mockGoogleUser.given_name);
			expect(oauthAccount?.familyName).toBe(mockGoogleUser.family_name);
			expect(oauthAccount?.profilePictureUrl).toBe(
				mockGoogleUser.picture,
			);
			expect(oauthAccount?.locale).toBe(mockGoogleUser.locale);
			expect(oauthAccount?.accessToken).toBe(mockToken.token);
		});
	});

	describe("Database constraint handling", () => {
		test("should handle duplicate Google account linking gracefully", async () => {
			// Create a user manually
			const userId = createId();
			await db.insert(users).values({
				id: userId,
				username: "duplicate-test@example.com",
				email: "duplicate-test@example.com",
				name: "Duplicate Test User",
				password: "",
				isEnabled: true,
			});

			// Create Google OAuth record manually
			const googleAccountId = createId();
			await db.insert(oauthGoogle).values({
				id: googleAccountId,
				userId,
				providerId: "google-duplicate-123",
				email: "duplicate-test@example.com",
				accessToken: "old-token",
			});

			// Mock Google user with same provider ID
			const mockGoogleUser = {
				id: "google-duplicate-123",
				email: "duplicate-test@example.com",
				name: "Duplicate Test User",
				given_name: "Duplicate",
				family_name: "Test",
				picture: "https://example.com/avatar.jpg",
				locale: "en",
			};

			const mockToken = {
				token: "new-token",
				expires_in: 3600,
				refresh_token: "new-refresh-token",
			};

			// Mock the services and middleware
			mock.module(
				"../../../services/appSettings/appSettingServices",
				() => ({
					getAppSettingValue: mock(async (key: AppSettingKey) => {
						switch (key) {
							case "oauth.google.enabled":
								return true;
							case "oauth.google.clientId":
								return "test-client-id";
							case "oauth.google.clientSecret":
								return "test-client-secret";
							default:
								return undefined;
						}
					}),
				}),
			);

			mock.module("@hono/oauth-providers/google", () => ({
				googleAuth: mock(() => {
					return mock(async (c: Context, next: Next) => {
						c.set("user-google", mockGoogleUser);
						c.set("token", mockToken);
						await next();
					});
				}),
			}));

			mock.module("../../../appEnv", () => ({
				default: {
					FRONTEND_URL: "http://localhost:3000",
				},
			}));


			// Should successfully update existing Google account
			const res = await client.auth.google.$get();
			expect(res.status).toBe(302);

			// Verify token was updated
			const updatedAccount = await db.query.oauthGoogle.findFirst({
				where: eq(oauthGoogle.id, googleAccountId),
			});
			expect(updatedAccount?.accessToken).toBe("new-token");

			// Verify no duplicate accounts were created
			const accountCount = await db
				.select()
				.from(oauthGoogle)
				.where(eq(oauthGoogle.providerId, "google-duplicate-123"));
			expect(accountCount).toHaveLength(1);

			// Cleanup
			await db
				.delete(oauthGoogle)
				.where(eq(oauthGoogle.id, googleAccountId));
			await db.delete(users).where(eq(users.id, userId));
		});
	});

	describe("Session management", () => {
		test("should clean up expired sessions", async () => {
			// Mock Google OAuth
			const mockGoogleUser = {
				id: "google-session-test-123",
				email: "session-test@example.com",
				name: "Session Test User",
			};

			mock.module(
				"../../../services/appSettings/appSettingServices",
				() => ({
					getAppSettingValue: mock(async (key: AppSettingKey) => {
						switch (key) {
							case "oauth.google.enabled":
								return true;
							case "oauth.google.clientId":
								return "test-client-id";
							case "oauth.google.clientSecret":
								return "test-client-secret";
							default:
								return undefined;
						}
					}),
				}),
			);

			mock.module("@hono/oauth-providers/google", () => ({
				googleAuth: mock(() => {
					return mock(async (c: Context, next: Next) => {
						c.set("user-google", mockGoogleUser);
						c.set("token", { token: "test-token" });
						await next();
					});
				}),
			}));

			mock.module("../../../appEnv", () => ({
				default: {
					FRONTEND_URL: "http://localhost:3000",
				},
			}));


			// Create a session
			const authRes = await client.auth.google.$get();
			expect(authRes.status).toBe(302);

			const location = authRes.headers.get("location");
			const sessionId = location?.split("session=")[1];
			expect(sessionId).toBeDefined();

			if (!sessionId) {
				throw new Error("Session ID not found");
			}

			// First access should work
			const firstAccess = await client.auth.google["auth-data"][
				":sessionId"
			].$get({
				param: { sessionId },
			});
			expect(firstAccess.status).toBe(200);

			// Second access should fail (session consumed)
			const secondAccess = await client.auth.google["auth-data"][
				":sessionId"
			].$get({
				param: { sessionId },
			});
			expect(secondAccess.status).toBe(404);

			// Cleanup user
			await db
				.delete(oauthGoogle)
				.where(eq(oauthGoogle.email, mockGoogleUser.email));
			await db.delete(users).where(eq(users.email, mockGoogleUser.email));
		});
	});

	describe("Error scenarios", () => {
		test("should handle missing Google user ID gracefully", async () => {
			// Mock Google user without ID
			const mockGoogleUser = {
				id: undefined,
				email: "no-id-test@example.com",
				name: "No ID Test User",
			};

			mock.module(
				"../../../services/appSettings/appSettingServices",
				() => ({
					getAppSettingValue: mock(async (key: AppSettingKey) => {
						switch (key) {
							case "oauth.google.enabled":
								return true;
							case "oauth.google.clientId":
								return "test-client-id";
							case "oauth.google.clientSecret":
								return "test-client-secret";
							default:
								return undefined;
						}
					}),
				}),
			);

			mock.module("@hono/oauth-providers/google", () => ({
				googleAuth: mock(() => {
					return mock(async (c: Context, next: Next) => {
						c.set("user-google", mockGoogleUser);
						c.set("token", { token: "test-token" });
						await next();
					});
				}),
			}));

			mock.module("../../../appEnv", () => ({
				default: {
					FRONTEND_URL: "http://localhost:3000",
				},
			}));


			const res = await client.auth.google.$get();

			// Should still work as the code uses user.id ?? "" for providerId
			expect(res.status).toBe(302);

			// Cleanup
			await db
				.delete(oauthGoogle)
				.where(eq(oauthGoogle.email, mockGoogleUser.email));
			await db.delete(users).where(eq(users.email, mockGoogleUser.email));
		});

		test("should handle user creation with minimal Google profile data", async () => {
			// Mock Google user with minimal data
			const mockGoogleUser = {
				id: "minimal-data-123",
				email: "minimal@example.com",
				// Intentionally omit optional fields like name, given_name, etc.
			};

			mock.module(
				"../../../services/appSettings/appSettingServices",
				() => ({
					getAppSettingValue: mock(async (key: AppSettingKey) => {
						switch (key) {
							case "oauth.google.enabled":
								return true;
							case "oauth.google.clientId":
								return "test-client-id";
							case "oauth.google.clientSecret":
								return "test-client-secret";
							default:
								return undefined;
						}
					}),
				}),
			);

			mock.module("@hono/oauth-providers/google", () => ({
				googleAuth: mock(() => {
					return mock(async (c: Context, next: Next) => {
						c.set("user-google", mockGoogleUser);
						c.set("token", { token: "test-token" });
						await next();
					});
				}),
			}));

			mock.module("../../../appEnv", () => ({
				default: {
					FRONTEND_URL: "http://localhost:3000",
				},
			}));


			const res = await client.auth.google.$get();
			expect(res.status).toBe(302);

			// Verify user was created with fallback values
			const createdUser = await db.query.users.findFirst({
				where: eq(users.email, mockGoogleUser.email),
			});
			expect(createdUser).toBeDefined();
			expect(createdUser?.name).toBe(""); // Should fallback to empty string

			// Cleanup
			await db
				.delete(oauthGoogle)
				.where(eq(oauthGoogle.providerId, mockGoogleUser.id));
			await db.delete(users).where(eq(users.email, mockGoogleUser.email));
		});
	});
});
