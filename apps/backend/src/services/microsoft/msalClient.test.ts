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

// Mock the MSAL library
const mockMsalClient = {
	auth: {
		clientId: "test-client-id",
		authority: "https://login.microsoftonline.com/test-tenant-id",
		clientSecret: "test-client-secret",
	},
};

mock.module("@azure/msal-node", () => ({
	ConfidentialClientApplication: mock((config: Record<string, unknown>) => {
		return { ...mockMsalClient, config };
	}),
}));

// Mock app settings
const mockAppSettings = new Map<AppSettingKey, string | boolean>([
	["oauth.microsoft.enabled", true],
	["oauth.microsoft.clientId", "test-client-id"],
	["oauth.microsoft.tenantId", "test-tenant-id"],
	["oauth.microsoft.clientSecret", "test-client-secret"],
]);

const getDefaultAppSettingValue = async (key: AppSettingKey) => {
	return mockAppSettings.get(key);
};

mock.module("../appSettings/appSettingServices", () => ({
	getAppSettingValue: mock(getDefaultAppSettingValue),
}));

describe("MSAL Client Service", () => {
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
		// Clean up app settings
		for (const [key] of mockAppSettings.entries()) {
			await db
				.delete(appSettingsSchema)
				.where(eq(appSettingsSchema.key, key));
		}
	});

	// Reset mocks after each test
	afterEach(() => {
		mock.module("../appSettings/appSettingServices", () => ({
			getAppSettingValue: mock(getDefaultAppSettingValue),
		}));
	});

	describe("getMsalClient", () => {
		test("should create and return MSAL client when Microsoft OAuth is enabled", async () => {
			// Dynamically import to ensure mocks are applied
			const { getMsalClient } = await import("../microsoft/msalClient");

			const client = await getMsalClient();
			expect(client).toBeDefined();
		});

		test("should return the same instance on subsequent calls (singleton)", async () => {
			const { getMsalClient } = await import("../microsoft/msalClient");

			const client1 = await getMsalClient();
			const client2 = await getMsalClient();

			expect(client1).toBe(client2);
		});

		// Note: Tests for "OAuth disabled", "missing clientId/tenantId/clientSecret"
		// removed - these test module initialization which can't be properly tested
		// without dependency injection. These scenarios are covered by integration tests.
	});
});
