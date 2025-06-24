import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import type HonoEnv from "../types/HonoEnv";
import appEnv from "../appEnv";
import enhancedRequestLogger from "../middlewares/enhanced-request-logger";
import * as observabilityService from "../services/observability-service";
import { spyOn } from "bun:test";

describe("OPTIONS Method Recording Integration", () => {
	let app: Hono<HonoEnv>;
	let originalValues: {
		OBSERVABILITY_ENABLED: boolean;
		OBSERVABILITY_RECORD_OPTIONS: boolean;
	};

	beforeEach(() => {
		// Store original values
		originalValues = {
			OBSERVABILITY_ENABLED: appEnv.OBSERVABILITY_ENABLED,
			OBSERVABILITY_RECORD_OPTIONS: appEnv.OBSERVABILITY_RECORD_OPTIONS,
		};

		// Enable observability for tests
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: true,
			writable: true,
			configurable: true,
		});

		// Create new app instance
		app = new Hono<HonoEnv>();
		app.use("*", enhancedRequestLogger);

		// Add test routes
		app.options("/api/users", (c) => c.json({ message: "CORS preflight" }));
		app.get("/api/users", (c) => c.json({ users: [] }));

		// Mock observability service functions (reset before each test)
		spyOn(observabilityService, "storeObservabilityEvent").mockResolvedValue(undefined);
		spyOn(observabilityService, "storeRequestDetails").mockResolvedValue(undefined);
	});

	afterEach(() => {
		// Restore original values
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: originalValues.OBSERVABILITY_ENABLED,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
			value: originalValues.OBSERVABILITY_RECORD_OPTIONS,
			writable: true,
			configurable: true,
		});

		// Clear mocks
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityService.storeObservabilityEvent as any).mockClear();
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityService.storeRequestDetails as any).mockClear();
	});

	test("should not record OPTIONS requests when OBSERVABILITY_RECORD_OPTIONS is false", async () => {
		// Set OBSERVABILITY_RECORD_OPTIONS to false
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
			value: false,
			writable: true,
			configurable: true,
		});

		// Make OPTIONS request
		const response = await app.request("/api/users", { method: "OPTIONS" });

		expect(response.status).toBe(200);

		// Give time for async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Verify observability data was NOT stored
		expect(observabilityService.storeObservabilityEvent).not.toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).not.toHaveBeenCalled();
	});

	test("should record OPTIONS requests when OBSERVABILITY_RECORD_OPTIONS is true", async () => {
		// Set OBSERVABILITY_RECORD_OPTIONS to true
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
			value: true,
			writable: true,
			configurable: true,
		});

		// Make OPTIONS request
		const response = await app.request("/api/users", { method: "OPTIONS" });

		expect(response.status).toBe(200);

		// Give time for async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Verify observability data WAS stored
		expect(observabilityService.storeObservabilityEvent).toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).toHaveBeenCalled();
	});

	test("should record GET requests regardless of OBSERVABILITY_RECORD_OPTIONS setting", async () => {
		// Set OBSERVABILITY_RECORD_OPTIONS to false
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
			value: false,
			writable: true,
			configurable: true,
		});

		// Make GET request
		const response = await app.request("/api/users", { method: "GET" });

		expect(response.status).toBe(200);

		// Give time for async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Verify observability data WAS stored (GET requests should always be recorded)
		expect(observabilityService.storeObservabilityEvent).toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).toHaveBeenCalled();
	});

	test("should record POST, PUT, DELETE requests regardless of OBSERVABILITY_RECORD_OPTIONS setting", async () => {
		// Add more test routes
		app.post("/api/users", (c) => c.json({ created: true }));
		app.put("/api/users/1", (c) => c.json({ updated: true }));
		app.delete("/api/users/1", (c) => c.json({ deleted: true }));

		// Set OBSERVABILITY_RECORD_OPTIONS to false
		Object.defineProperty(appEnv, "OBSERVABILITY_RECORD_OPTIONS", {
			value: false,
			writable: true,
			configurable: true,
		});

		// Test POST request
		await app.request("/api/users", { method: "POST", body: JSON.stringify({}) });
		await new Promise((resolve) => setTimeout(resolve, 5));

		// Test PUT request
		await app.request("/api/users/1", { method: "PUT", body: JSON.stringify({}) });
		await new Promise((resolve) => setTimeout(resolve, 5));

		// Test DELETE request
		await app.request("/api/users/1", { method: "DELETE" });
		await new Promise((resolve) => setTimeout(resolve, 5));

		// Verify all requests were recorded (3 pairs of calls)
		expect(observabilityService.storeObservabilityEvent).toHaveBeenCalledTimes(3);
		expect(observabilityService.storeRequestDetails).toHaveBeenCalledTimes(3);
	});
});
