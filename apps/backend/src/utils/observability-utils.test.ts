import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
	sanitizeObject,
	sanitizeRequestData,
	shouldRecordRequest,
	truncateData,
	extractHeaders,
	getClientIp,
} from "./observability-utils";

// Mock the appEnv module
import appEnv from "../appEnv";

describe("Observability Utils", () => {
	// Store original values
	const originalValues = {
		OBSERVABILITY_ENABLED: appEnv.OBSERVABILITY_ENABLED,
		OBSERVABILITY_RECORD_SELF: appEnv.OBSERVABILITY_RECORD_SELF,
		OBSERVABILITY_MASK_SENSITIVE_DATA:
			appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA,
		OBSERVABILITY_MAX_BODY_SIZE: appEnv.OBSERVABILITY_MAX_BODY_SIZE,
	};

	beforeEach(() => {
		// Set default test values
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: true,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_SELF", {
			value: false,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_MASK_SENSITIVE_DATA", {
			value: true,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_MAX_BODY_SIZE", {
			value: 1024,
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		// Restore original values
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: originalValues.OBSERVABILITY_ENABLED,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_SELF", {
			value: originalValues.OBSERVABILITY_RECORD_SELF,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_MASK_SENSITIVE_DATA", {
			value: originalValues.OBSERVABILITY_MASK_SENSITIVE_DATA,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_MAX_BODY_SIZE", {
			value: originalValues.OBSERVABILITY_MAX_BODY_SIZE,
			writable: true,
			configurable: true,
		});
	});

	describe("sanitizeObject", () => {
		test("should mask sensitive fields when masking is enabled", () => {
			const testData = {
				username: "testuser",
				password: "secret123",
				email: "test@example.com",
				authToken: "bearer-token",
				apiKey: "api-key-123",
			};

			const result = sanitizeObject(testData) as Record<string, unknown>;

			expect(result.username).toBe("testuser");
			expect(result.password).toBe("[MASKED]");
			expect(result.email).toBe("test@example.com");
			expect(result.authToken).toBe("[MASKED]");
			expect(result.apiKey).toBe("[MASKED]");
		});

		test("should not mask fields when masking is disabled", () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA = false;

			const testData = {
				username: "testuser",
				password: "secret123",
				authToken: "bearer-token",
			};

			const result = sanitizeObject(testData) as Record<string, unknown>;

			expect(result.username).toBe("testuser");
			expect(result.password).toBe("secret123");
			expect(result.authToken).toBe("bearer-token");
		});

		test("should handle nested objects", () => {
			const testData = {
				user: {
					name: "John Doe",
					loginData: {
						password: "secret123",
						token: "auth-token",
					},
				},
				config: {
					apiKey: "api-key-123",
					settings: {
						secret: "nested-secret",
					},
				},
			};

			const result = sanitizeObject(testData) as Record<string, unknown>;

			const user = result.user as Record<string, unknown>;
			expect(user.name).toBe("John Doe");
			expect(user.loginData).toBeDefined();
			const loginData = user.loginData as Record<string, unknown>;
			expect(loginData.password).toBe("[MASKED]");
			expect(loginData.token).toBe("[MASKED]");
			const config = result.config as Record<string, unknown>;
			expect(config.apiKey).toBe("[MASKED]");
			const settings = config.settings as Record<string, unknown>;
			expect(settings.secret).toBe("[MASKED]");
		});

		test("should handle arrays", () => {
			const testData = [
				{ name: "item1", password: "secret1" },
				{ name: "item2", token: "secret2" },
			];

			const result = sanitizeObject(testData) as Array<
				Record<string, unknown>
			>;

			expect(result).toHaveLength(2);
			expect(result[0]?.name).toBe("item1");
			expect(result[0]?.password).toBe("[MASKED]");
			expect(result[1]?.name).toBe("item2");
			expect(result[1]?.token).toBe("[MASKED]");
		});

		test("should return non-objects unchanged", () => {
			expect(sanitizeObject("string")).toBe("string");
			expect(sanitizeObject(123)).toBe(123);
			expect(sanitizeObject(null)).toBe(null);
			expect(sanitizeObject(undefined)).toBe(undefined);
		});

		test("should use custom patterns", () => {
			const customPatterns = [/custom/i, /special/i];
			const testData = {
				normalField: "value1",
				customField: "value2",
				specialField: "value3",
				password: "value4", // This won't be masked with custom patterns
			};

			const result = sanitizeObject(testData, customPatterns) as Record<
				string,
				unknown
			>;

			expect(result.normalField).toBe("value1");
			expect(result.customField).toBe("[MASKED]");
			expect(result.specialField).toBe("[MASKED]");
			expect(result.password).toBe("value4"); // Not masked with custom patterns
		});
	});

	describe("sanitizeRequestData", () => {
		test("should sanitize request data when masking is enabled", () => {
			const requestData = {
				body: {
					username: "testuser",
					password: "secret123",
				},
				headers: {
					"content-type": "application/json",
					authorization: "Bearer token123",
				},
			};

			const result = sanitizeRequestData(requestData) as Record<
				string,
				unknown
			>;

			const body = result.body as Record<string, unknown>;
			expect(body.username).toBe("testuser");
			expect(body.password).toBe("[MASKED]");
			const headers = result.headers as Record<string, unknown>;
			expect(headers["content-type"]).toBe("application/json");
			expect(headers.authorization).toBe("[MASKED]");
		});

		test("should return original data when masking is disabled", () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA = false;

			const requestData = {
				body: { password: "secret123" },
			};

			const result = sanitizeRequestData(requestData);

			expect(result).toEqual(requestData);
		});
	});

	describe("shouldRecordRequest", () => {
		test("should return false when observability is disabled", () => {
			Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
				value: false,
				writable: true,
				configurable: true,
			});

			expect(shouldRecordRequest("/api/users", "GET")).toBe(false);
		});

		test("should return false for observability routes when RECORD_SELF is false", () => {
			Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_SELF", {
				value: false,
				writable: true,
				configurable: true,
			});

			expect(shouldRecordRequest("/observability/events", "GET")).toBe(
				false,
			);
			expect(shouldRecordRequest("/observability/dashboard", "GET")).toBe(
				false,
			);
		});

		test("should return true for observability routes when RECORD_SELF is true", () => {
			Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_SELF", {
				value: true,
				writable: true,
				configurable: true,
			});

			expect(shouldRecordRequest("/observability/events", "GET")).toBe(
				true,
			);
			expect(shouldRecordRequest("/observability/dashboard", "GET")).toBe(
				true,
			);
		});

		test("should return false for OPTIONS requests when RECORD_OPTIONS is false", () => {
			Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
				value: false,
				writable: true,
				configurable: true,
			});

			expect(shouldRecordRequest("/api/users", "OPTIONS")).toBe(false);
			expect(shouldRecordRequest("/auth/login", "OPTIONS")).toBe(false);
		});

		test("should return true for OPTIONS requests when RECORD_OPTIONS is true", () => {
			Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
				value: true,
				writable: true,
				configurable: true,
			});

			expect(shouldRecordRequest("/api/users", "OPTIONS")).toBe(true);
			expect(shouldRecordRequest("/auth/login", "OPTIONS")).toBe(true);
		});

		test("should return false for health check and test endpoints", () => {
			expect(shouldRecordRequest("/test", "GET")).toBe(false);
			expect(shouldRecordRequest("/health", "GET")).toBe(false);
		});

		test("should return true for regular API endpoints", () => {
			expect(shouldRecordRequest("/api/users", "GET")).toBe(true);
			expect(shouldRecordRequest("/auth/login", "POST")).toBe(true);
			expect(shouldRecordRequest("/dashboard/sidebar-items", "GET")).toBe(
				true,
			);
		});

		test("should work without method parameter (backward compatibility)", () => {
			expect(shouldRecordRequest("/api/users")).toBe(true);
			expect(shouldRecordRequest("/health")).toBe(false);
		});
	});

	describe("truncateData", () => {
		test("should truncate large data", () => {
			const largeData = "a".repeat(2000);
			const result = truncateData(largeData) as string;

			expect(result).toContain("[TRUNCATED");
			expect(result).toContain("Original size: 2000 bytes");
			expect(result.length).toBeLessThan(largeData.length);
		});

		test("should not truncate small data", () => {
			const smallData = "small data";
			const result = truncateData(smallData);

			expect(result).toBe(smallData);
		});

		test("should handle JSON objects", () => {
			const largeObject = {
				data: "a".repeat(2000),
				other: "field",
			};

			const result = truncateData(largeObject) as string;

			expect(typeof result).toBe("string");
			expect(result).toContain("[TRUNCATED");
		});

		test("should respect custom max size", () => {
			const data = "a".repeat(100);
			const result = truncateData(data, 50) as string;

			expect(result).toContain("[TRUNCATED");
			expect(result).toContain("Original size: 100 bytes");
		});

		test("should handle null and undefined", () => {
			expect(truncateData(null)).toBe(null);
			expect(truncateData(undefined)).toBe(undefined);
		});
	});

	describe("extractHeaders", () => {
		test("should extract request headers", () => {
			const headers = new Headers({
				"content-type": "application/json",
				"user-agent": "test-agent",
				authorization: "Bearer token",
				"x-custom-header": "custom-value",
			});

			const result = extractHeaders(headers, true);

			expect(result["content-type"]).toBe("application/json");
			expect(result["user-agent"]).toBe("test-agent");
			expect(result["authorization"]).toBe("[MASKED]"); // Should be masked
			expect(result["x-custom-header"]).toBeUndefined(); // Not in allowed list
		});

		test("should extract response headers", () => {
			const headers = new Headers({
				"content-type": "application/json",
				"cache-control": "no-cache",
				"set-cookie": "session=123",
				"x-custom-header": "custom-value",
			});

			const result = extractHeaders(headers, false);

			expect(result["content-type"]).toBe("application/json");
			expect(result["cache-control"]).toBe("no-cache");
			expect(result["set-cookie"]).toBe("session=123");
			expect(result["x-custom-header"]).toBeUndefined(); // Not in allowed list
		});

		test("should handle plain object headers", () => {
			const headers = {
				"Content-Type": "application/json",
				"User-Agent": "test-agent",
			};

			const result = extractHeaders(headers, true);

			expect(result["content-type"]).toBe("application/json");
			expect(result["user-agent"]).toBe("test-agent");
		});

		test("should sanitize sensitive headers", () => {
			const headers = new Headers({
				authorization: "Bearer secret-token",
				"x-api-key": "secret-key",
				"content-type": "application/json",
			});

			const result = extractHeaders(headers, true);

			expect(result["authorization"]).toBe("[MASKED]");
			expect(result["content-type"]).toBe("application/json");
		});
	});

	describe("getClientIp", () => {
		test("should extract IP from x-forwarded-for", () => {
			const headers = new Headers({
				"x-forwarded-for": "203.0.113.1, 198.51.100.1",
			});

			const result = getClientIp(headers);

			expect(result).toBe("203.0.113.1");
		});

		test("should extract IP from x-real-ip", () => {
			const headers = new Headers({
				"x-real-ip": "203.0.113.1",
			});

			const result = getClientIp(headers);

			expect(result).toBe("203.0.113.1");
		});

		test("should extract IP from x-client-ip", () => {
			const headers = new Headers({
				"x-client-ip": "203.0.113.1",
			});

			const result = getClientIp(headers);

			expect(result).toBe("203.0.113.1");
		});

		test("should return null when no IP headers are present", () => {
			const headers = new Headers({
				"content-type": "application/json",
			});

			const result = getClientIp(headers);

			expect(result).toBe(null);
		});

		test("should handle empty x-forwarded-for", () => {
			const headers = new Headers({
				"x-forwarded-for": "",
			});

			const result = getClientIp(headers);

			expect(result).toBe(null);
		});

		test("should trim whitespace from IP addresses", () => {
			const headers = new Headers({
				"x-forwarded-for": "  203.0.113.1  , 198.51.100.1",
			});

			const result = getClientIp(headers);

			expect(result).toBe("203.0.113.1");
		});
	});
});
