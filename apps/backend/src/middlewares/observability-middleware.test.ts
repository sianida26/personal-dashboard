import {
	describe,
	test,
	expect,
	beforeEach,
	afterEach,
	mock,
	spyOn,
} from "bun:test";
import { Hono } from "hono";
import observabilityMiddleware from "./observability-middleware";
import type HonoEnv from "../types/HonoEnv";

// Import the actual modules so we can spy on them
import * as cuid2 from "@paralleldrive/cuid2";
import appEnv from "../appEnv";
import appLogger from "../utils/logger";
import * as observabilityUtils from "../utils/observability-utils";
import * as observabilityService from "../services/observability-service";

describe("Enhanced Request Logger Middleware", () => {
	let app: Hono<HonoEnv>;

	// Store original implementations and spies
	const originalAppEnv = { ...appEnv };
	let spies: ReturnType<typeof spyOn>[] = [];

	beforeEach(() => {
		// Clear previous spies
		spies.forEach((spy) => spy.mockRestore());
		spies = [];

		// Use spyOn instead of mock.module
		spies.push(spyOn(cuid2, "createId").mockReturnValue("test-request-id"));

		// Mock appEnv properties
		Object.defineProperty(appEnv, "LOG_REQUEST", {
			value: true,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: true,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_STORE_REQUEST_BODIES", {
			value: true,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_STORE_RESPONSE_BODIES", {
			value: true,
			writable: true,
			configurable: true,
		});

		spies.push(spyOn(appLogger, "request").mockImplementation(() => {}));

		spies.push(
			spyOn(observabilityUtils, "shouldRecordRequest").mockReturnValue(
				true,
			),
		);
		spies.push(
			spyOn(observabilityUtils, "extractHeaders").mockReturnValue({}),
		);
		spies.push(
			spyOn(observabilityUtils, "getClientIp").mockReturnValue(
				"192.168.1.1",
			),
		);

		spies.push(
			spyOn(
				observabilityService,
				"storeObservabilityEvent",
			).mockResolvedValue(),
		);
		spies.push(
			spyOn(
				observabilityService,
				"storeRequestDetails",
			).mockResolvedValue(),
		);
		spies.push(
			spyOn(observabilityService, "extractRequestBody").mockResolvedValue(
				null,
			),
		);
		spies.push(
			spyOn(
				observabilityService,
				"extractResponseBody",
			).mockResolvedValue(null),
		);

		// Create fresh app instance
		app = new Hono<HonoEnv>();
		app.use(observabilityMiddleware);
		app.get("/test", (c) => c.json({ message: "test" }));
	});

	afterEach(() => {
		// Restore all spies individually
		spies.forEach((spy) => spy.mockRestore());
		spies = [];

		// Also use mock.restore() as backup
		mock.restore();

		// Restore original appEnv values
		Object.defineProperty(appEnv, "LOG_REQUEST", {
			value: originalAppEnv.LOG_REQUEST,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: originalAppEnv.OBSERVABILITY_ENABLED,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_STORE_REQUEST_BODIES", {
			value: originalAppEnv.OBSERVABILITY_STORE_REQUEST_BODIES,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_STORE_RESPONSE_BODIES", {
			value: originalAppEnv.OBSERVABILITY_STORE_RESPONSE_BODIES,
			writable: true,
			configurable: true,
		});
	});

	test("should set request ID in context", async () => {
		let capturedRequestId: string | undefined;

		app.get("/capture-id", (c) => {
			capturedRequestId = c.var.requestId;
			return c.json({ requestId: capturedRequestId });
		});

		const response = await app.request("/capture-id");

		expect(response.status).toBe(200);
		expect(capturedRequestId).toBe("test-request-id");
		expect(cuid2.createId).toHaveBeenCalled();
	});

	test("should log request when LOG_REQUEST is enabled", async () => {
		const response = await app.request("/test");

		expect(response.status).toBe(200);
		expect(appLogger.request).toHaveBeenCalled();

		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		const loggerCall = (appLogger.request as any).mock.calls[0];
		if (loggerCall && loggerCall.length > 1) {
			expect(loggerCall[1]).toBeTypeOf("number"); // response time
		}
	});

	test("should not log request when LOG_REQUEST is disabled", async () => {
		Object.defineProperty(appEnv, "LOG_REQUEST", {
			value: false,
			writable: true,
			configurable: true,
		});

		const response = await app.request("/test");

		expect(response.status).toBe(200);
		expect(appLogger.request).not.toHaveBeenCalled();
	});

	test("should store observability data when enabled and should record", async () => {
		// Add a delay to ensure async operations complete
		await app.request("/test");

		// Give some time for async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(observabilityUtils.shouldRecordRequest).toHaveBeenCalledWith(
			"/test",
			"GET",
		);
		expect(observabilityService.storeObservabilityEvent).toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).toHaveBeenCalled();
	});

	test("should not store observability data when should not record", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityUtils.shouldRecordRequest as any).mockReturnValue(false);

		await app.request("/test");

		// Give some time for any potential async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(observabilityUtils.shouldRecordRequest).toHaveBeenCalledWith(
			"/test",
			"GET",
		);
		expect(
			observabilityService.storeObservabilityEvent,
		).not.toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).not.toHaveBeenCalled();
	});

	test("should not store observability data when observability is disabled", async () => {
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: false,
			writable: true,
			configurable: true,
		});

		await app.request("/test");

		// Give some time for any potential async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(
			observabilityService.storeObservabilityEvent,
		).not.toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).not.toHaveBeenCalled();
	});

	test("should pass through when neither logging nor observability is enabled", async () => {
		Object.defineProperty(appEnv, "LOG_REQUEST", {
			value: false,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "OBSERVABILITY_ENABLED", {
			value: false,
			writable: true,
			configurable: true,
		});
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityUtils.shouldRecordRequest as any).mockReturnValue(false);

		const response = await app.request("/test");

		expect(response.status).toBe(200);
		expect(appLogger.request).not.toHaveBeenCalled();
		expect(
			observabilityService.storeObservabilityEvent,
		).not.toHaveBeenCalled();
		expect(observabilityService.storeRequestDetails).not.toHaveBeenCalled();
	});

	test("should handle observability storage errors gracefully", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityService.storeObservabilityEvent as any).mockRejectedValue(
			new Error("Storage error"),
		);
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityService.storeRequestDetails as any).mockRejectedValue(
			new Error("Storage error"),
		);

		const response = await app.request("/test");

		expect(response.status).toBe(200);
		// Should still complete successfully despite storage errors
	});

	test("should extract request body when configured", async () => {
		const testBody = { data: "test" };
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityService.extractRequestBody as any).mockReturnValue(
			Promise.resolve(testBody as unknown),
		);

		app.post("/post-test", (c) => c.json({ received: true }));

		const response = await app.request("/post-test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(testBody),
		});

		expect(response.status).toBe(200);
		expect(observabilityService.extractRequestBody).toHaveBeenCalled();
	});

	test("should not extract request body when body storage is disabled", async () => {
		Object.defineProperty(appEnv, "OBSERVABILITY_STORE_REQUEST_BODIES", {
			value: false,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(appEnv, "LOG_REQUEST", {
			value: false,
			writable: true,
			configurable: true,
		});

		app.post("/post-test", (c) => c.json({ received: true }));

		const response = await app.request("/post-test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: "test" }),
		});

		expect(response.status).toBe(200);
		expect(observabilityService.extractRequestBody).not.toHaveBeenCalled();
	});

	test("should measure response time correctly", async () => {
		// Add artificial delay to test response time measurement
		app.get("/slow", async (c) => {
			await new Promise((resolve) => setTimeout(resolve, 50));
			return c.json({ message: "slow response" });
		});

		const response = await app.request("/slow");

		expect(response.status).toBe(200);

		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		const loggerCall = (appLogger.request as any).mock.calls[0];
		if (loggerCall && loggerCall.length > 1) {
			const responseTime = loggerCall[1];
			expect(responseTime).toBeTypeOf("number");
			expect(responseTime).toBeGreaterThan(0);
		}
	});

	test("should handle different HTTP methods", async () => {
		app.post("/post", (c) => c.json({ method: "POST" }));
		app.put("/put", (c) => c.json({ method: "PUT" }));
		app.delete("/delete", (c) => c.json({ method: "DELETE" }));

		const methods = ["POST", "PUT", "DELETE"];
		const endpoints = ["/post", "/put", "/delete"];

		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			const endpoint = endpoints[i];

			if (method && endpoint) {
				const response = await app.request(endpoint, { method });
				expect(response.status).toBe(200);
			}
		}

		// Each request should have been processed
		expect(observabilityUtils.shouldRecordRequest).toHaveBeenCalledTimes(
			methods.length,
		);
	});

	test("should preserve request cloning for logging", async () => {
		Object.defineProperty(appEnv, "LOG_REQUEST", {
			value: true,
			writable: true,
			configurable: true,
		});
		// biome-ignore lint/suspicious/noExplicitAny: Mock type casting needed for testing
		(observabilityUtils.shouldRecordRequest as any).mockReturnValue(true);

		app.post("/clone-test", async (c) => {
			// Try to read the body - this should still work due to cloning
			const body = await c.req.json();
			return c.json({ received: body });
		});

		const testBody = { test: "data" };
		const response = await app.request("/clone-test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(testBody),
		});

		expect(response.status).toBe(200);
		const result = await response.json();
		expect(result).toEqual({ received: testBody });

		// Logger should have been called
		expect(appLogger.request).toHaveBeenCalled();
	});

	test("should handle requests with query parameters", async () => {
		const response = await app.request("/test?param1=value1&param2=value2");

		expect(response.status).toBe(200);
		expect(observabilityUtils.shouldRecordRequest).toHaveBeenCalledWith(
			"/test",
			"GET",
		);
	});

	test("should handle requests with special headers", async () => {
		const response = await app.request("/test", {
			headers: {
				"User-Agent": "test-agent",
				"X-Forwarded-For": "203.0.113.1",
				Authorization: "Bearer token123",
			},
		});

		expect(response.status).toBe(200);
		expect(observabilityUtils.getClientIp).toHaveBeenCalled();
		expect(observabilityUtils.extractHeaders).toHaveBeenCalled();
	});
});
