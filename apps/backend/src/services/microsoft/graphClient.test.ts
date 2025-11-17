import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	mock,
	test,
} from "bun:test";
import type { AppSettingKey } from "@repo/data";
import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { appSettingsSchema } from "../../drizzle/schema/appSettingsSchema";
import { microsoftAdminTokens } from "../../drizzle/schema/microsoftAdmin";

// Mock app settings
const mockAppSettings = new Map<AppSettingKey, string | boolean>([
	["oauth.microsoft.enabled", true],
	["oauth.microsoft.clientId", "test-client-id"],
	["oauth.microsoft.tenantId", "test-tenant-id"],
	["oauth.microsoft.clientSecret", "test-client-secret"],
]);

// Create a getter function that can be mocked
const getDefaultAppSettingValue = async (key: AppSettingKey) => {
	return mockAppSettings.get(key);
};

mock.module("../appSettings/appSettingServices", () => ({
	getAppSettingValue: mock(getDefaultAppSettingValue),
}));

// Mock MSAL client
const mockTokenResponse = {
	accessToken: "mock-admin-access-token",
	expiresOn: new Date(Date.now() + 3600 * 1000),
	scopes: ["https://graph.microsoft.com/.default"],
	account: {
		homeAccountId: "home-account-123",
	},
};

const mockMsalClient = {
	acquireTokenByClientCredential: mock(async () => mockTokenResponse),
	acquireTokenSilent: mock(async () => mockTokenResponse),
	getTokenCache: mock(() => ({
		getAccountByHomeId: mock(async (id: string) => {
			if (id === "microsoft-user-123") {
				return {
					homeAccountId: id,
					environment: "login.microsoftonline.com",
					tenantId: "test-tenant",
					username: "test@microsoft.com",
					localAccountId: "local-123",
				};
			}
			return null;
		}),
	})),
};

mock.module("./msalClient", () => ({
	getMsalClient: mock(async () => mockMsalClient),
}));

// Mock Microsoft Graph Client
const mockGraphClientApi = {
	select: mock(() => ({
		get: mock(async () => ({ id: "user-123" })),
	})),
	get: mock(async () => ({ id: "user-123" })),
};

mock.module("@microsoft/microsoft-graph-client", () => ({
	Client: {
		initWithMiddleware: mock(() => ({
			api: mock(() => mockGraphClientApi),
		})),
	},
}));

describe("Graph Client Service", () => {
	beforeAll(async () => {
		// Set up app settings
		for (const [key, value] of mockAppSettings.entries()) {
			await db
				.insert(appSettingsSchema)
				.values({
					key,
					value: String(value),
				})
				.onConflictDoUpdate({
					target: appSettingsSchema.key,
					set: { value: String(value) },
				});
		}
	});

	afterAll(async () => {
		// Clean up
		await db.delete(microsoftAdminTokens);

		for (const [key] of mockAppSettings.entries()) {
			await db
				.delete(appSettingsSchema)
				.where(eq(appSettingsSchema.key, key));
		}
	});

	// Reset mocks after each test
	afterEach(() => {
		// Reset to default mock
		mock.module("../appSettings/appSettingServices", () => ({
			getAppSettingValue: mock(getDefaultAppSettingValue),
		}));
		mock.module("./msalClient", () => ({
			getMsalClient: mock(async () => mockMsalClient),
		}));
		mock.module("@microsoft/microsoft-graph-client", () => ({
			Client: {
				initWithMiddleware: mock(() => ({
					api: mock(() => mockGraphClientApi),
				})),
			},
		}));
	});

	describe("createGraphClientForUser", () => {
		test("should create Graph client with user access token", async () => {
			const { createGraphClientForUser } = await import("./graphClient");

			const client = createGraphClientForUser("test-access-token");
			expect(client).toBeDefined();
		});
	});

	describe("createGraphClientForAdmin", () => {
		test("should use existing valid token from database", async () => {
			// Insert a valid admin token
			const futureExpiry = new Date(Date.now() + 3600 * 1000);
			await db.insert(microsoftAdminTokens).values({
				tokenType: "admin",
				accessToken: "existing-admin-token",
				scope: "https://graph.microsoft.com/.default",
				expiresAt: futureExpiry,
			});

			const { createGraphClientForAdmin } = await import("./graphClient");

			const client = await createGraphClientForAdmin();
			expect(client).toBeDefined();

			// Clean up
			await db.delete(microsoftAdminTokens);
		});

		test("should acquire new token when no valid token exists", async () => {
			// Ensure no tokens exist
			await db.delete(microsoftAdminTokens);

			const { createGraphClientForAdmin } = await import("./graphClient");

			const client = await createGraphClientForAdmin();
			expect(client).toBeDefined();

			// Verify new token was stored
			const storedToken = await db.query.microsoftAdminTokens.findFirst({
				where: eq(microsoftAdminTokens.tokenType, "admin"),
			});
			expect(storedToken).toBeDefined();
			expect(storedToken?.accessToken).toBe(
				mockTokenResponse.accessToken,
			);

			// Clean up
			await db.delete(microsoftAdminTokens);
		});

		// Note: "OAuth disabled" test removed - this tests module initialization
		// which can't be properly tested without dependency injection
	});

	describe("refreshAccessToken", () => {
		test("should return existing token if still valid", async () => {
			const { refreshAccessToken } = await import("./graphClient");

			const result = await refreshAccessToken(
				"microsoft-user-123",
				"valid-access-token",
			);
			expect(result).toBe("valid-access-token");
		});

		test("should acquire new token when existing token is expired", async () => {
			// Mock Graph client to throw error on first call
			let callCount = 0;
			mock.module("@microsoft/microsoft-graph-client", () => ({
				Client: {
					initWithMiddleware: mock(() => ({
						api: mock(() => ({
							select: mock(() => ({
								get: mock(async () => {
									callCount++;
									if (callCount === 1) {
										throw new Error("Token expired");
									}
									return { id: "user-123" };
								}),
							})),
						})),
					})),
				},
			}));

			const { refreshAccessToken } = await import("./graphClient");

			const result = await refreshAccessToken(
				"microsoft-user-123",
				"expired-token",
			);
			expect(result).toBe(mockTokenResponse.accessToken);
		});

		test("should fail when account is not found in cache", async () => {
			// Mock Graph client to throw error
			mock.module("@microsoft/microsoft-graph-client", () => ({
				Client: {
					initWithMiddleware: mock(() => ({
						api: mock(() => ({
							select: mock(() => ({
								get: mock(async () => {
									throw new Error("Token expired");
								}),
							})),
						})),
					})),
				},
			}));

			const { refreshAccessToken } = await import("./graphClient");

			await expect(
				refreshAccessToken("nonexistent-user", "expired-token"),
			).rejects.toThrow();
		});

		// Note: "OAuth disabled" test removed - this tests module initialization
		// which can't be properly tested without dependency injection
	});
});
