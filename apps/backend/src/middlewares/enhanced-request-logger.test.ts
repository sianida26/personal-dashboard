import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";
import enhancedRequestLogger from "./enhanced-request-logger";
import type HonoEnv from "../types/HonoEnv";

// Mock modules
const mockCreateId = mock(() => "test-request-id");
mock.module("@paralleldrive/cuid2", () => ({
	createId: mockCreateId,
}));

const mockAppEnv = {
	LOG_REQUEST: true,
	OBSERVABILITY_ENABLED: true,
	OBSERVABILITY_STORE_REQUEST_BODIES: true,
	OBSERVABILITY_STORE_RESPONSE_BODIES: true,
};

mock.module("../appEnv", () => ({ default: mockAppEnv }));

const mockAppLogger = {
	request: mock((_context: unknown, _responseTime: number) => {}),
};

mock.module("../utils/logger", () => ({ default: mockAppLogger }));

const mockShouldRecordRequest = mock(() => true);
const mockExtractHeaders = mock(() => ({}));
const mockGetClientIp = mock(() => "192.168.1.1");

mock.module("../utils/observability-utils", () => ({
	shouldRecordRequest: mockShouldRecordRequest,
	extractHeaders: mockExtractHeaders,
	getClientIp: mockGetClientIp,
}));

const mockStoreObservabilityEvent = mock(() => Promise.resolve());
const mockStoreRequestDetails = mock(() => Promise.resolve());
const mockExtractRequestBody = mock(() => Promise.resolve(null as unknown));
const mockExtractResponseBody = mock(() => Promise.resolve(null as unknown));

mock.module("../services/observability-service", () => ({
	storeObservabilityEvent: mockStoreObservabilityEvent,
	storeRequestDetails: mockStoreRequestDetails,
	extractRequestBody: mockExtractRequestBody,
	extractResponseBody: mockExtractResponseBody,
}));

describe("Enhanced Request Logger Middleware", () => {
	let app: Hono<HonoEnv>;

	beforeEach(() => {
		// Reset all mocks
		mockCreateId.mockClear();
		mockAppLogger.request.mockClear();
		mockShouldRecordRequest.mockClear();
		mockExtractHeaders.mockClear();
		mockGetClientIp.mockClear();
		mockStoreObservabilityEvent.mockClear();
		mockStoreRequestDetails.mockClear();
		mockExtractRequestBody.mockClear();
		mockExtractResponseBody.mockClear();

		// Reset mock implementations
		mockCreateId.mockReturnValue("test-request-id");
		mockShouldRecordRequest.mockReturnValue(true);
		mockExtractHeaders.mockReturnValue({});
		mockGetClientIp.mockReturnValue("192.168.1.1");
		mockExtractRequestBody.mockReturnValue(Promise.resolve(null));
		mockExtractResponseBody.mockReturnValue(Promise.resolve(null));
		mockStoreObservabilityEvent.mockReturnValue(Promise.resolve());
		mockStoreRequestDetails.mockReturnValue(Promise.resolve());

		// Reset environment
		mockAppEnv.LOG_REQUEST = true;
		mockAppEnv.OBSERVABILITY_ENABLED = true;
		mockAppEnv.OBSERVABILITY_STORE_REQUEST_BODIES = true;
		mockAppEnv.OBSERVABILITY_STORE_RESPONSE_BODIES = true;

		// Create fresh app instance
		app = new Hono<HonoEnv>();
		app.use(enhancedRequestLogger);
		app.get("/test", (c) => c.json({ message: "test" }));
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
		expect(mockCreateId).toHaveBeenCalled();
	});

	test("should log request when LOG_REQUEST is enabled", async () => {
		const response = await app.request("/test");

		expect(response.status).toBe(200);
		expect(mockAppLogger.request).toHaveBeenCalled();

		const loggerCall = mockAppLogger.request.mock.calls[0];
		if (loggerCall && loggerCall.length > 1) {
			expect(loggerCall[1]).toBeTypeOf("number"); // response time
		}
	});

	test("should not log request when LOG_REQUEST is disabled", async () => {
		mockAppEnv.LOG_REQUEST = false;

		const response = await app.request("/test");

		expect(response.status).toBe(200);
		expect(mockAppLogger.request).not.toHaveBeenCalled();
	});

	test("should store observability data when enabled and should record", async () => {
		// Add a delay to ensure async operations complete
		await app.request("/test");

		// Give some time for async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockShouldRecordRequest).toHaveBeenCalledWith("/test");
		expect(mockStoreObservabilityEvent).toHaveBeenCalled();
		expect(mockStoreRequestDetails).toHaveBeenCalled();
	});

	test("should not store observability data when should not record", async () => {
		mockShouldRecordRequest.mockReturnValue(false);

		await app.request("/test");

		// Give some time for any potential async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockShouldRecordRequest).toHaveBeenCalledWith("/test");
		expect(mockStoreObservabilityEvent).not.toHaveBeenCalled();
		expect(mockStoreRequestDetails).not.toHaveBeenCalled();
	});

	test("should not store observability data when observability is disabled", async () => {
		mockAppEnv.OBSERVABILITY_ENABLED = false;

		await app.request("/test");

		// Give some time for any potential async operations
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockStoreObservabilityEvent).not.toHaveBeenCalled();
		expect(mockStoreRequestDetails).not.toHaveBeenCalled();
	});

	test("should pass through when neither logging nor observability is enabled", async () => {
		mockAppEnv.LOG_REQUEST = false;
		mockAppEnv.OBSERVABILITY_ENABLED = false;
		mockShouldRecordRequest.mockReturnValue(false);

		const response = await app.request("/test");

		expect(response.status).toBe(200);
		expect(mockAppLogger.request).not.toHaveBeenCalled();
		expect(mockStoreObservabilityEvent).not.toHaveBeenCalled();
		expect(mockStoreRequestDetails).not.toHaveBeenCalled();
	});

	test("should handle observability storage errors gracefully", async () => {
		mockStoreObservabilityEvent.mockRejectedValue(
			new Error("Storage error"),
		);
		mockStoreRequestDetails.mockRejectedValue(new Error("Storage error"));

		const response = await app.request("/test");

		expect(response.status).toBe(200);
		// Should still complete successfully despite storage errors
	});

	test("should extract request body when configured", async () => {
		const testBody = { data: "test" };
		mockExtractRequestBody.mockReturnValue(
			Promise.resolve(testBody as unknown),
		);

		app.post("/post-test", (c) => c.json({ received: true }));

		const response = await app.request("/post-test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(testBody),
		});

		expect(response.status).toBe(200);
		expect(mockExtractRequestBody).toHaveBeenCalled();
	});

	test("should not extract request body when body storage is disabled", async () => {
		mockAppEnv.OBSERVABILITY_STORE_REQUEST_BODIES = false;
		mockAppEnv.LOG_REQUEST = false;

		app.post("/post-test", (c) => c.json({ received: true }));

		const response = await app.request("/post-test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: "test" }),
		});

		expect(response.status).toBe(200);
		expect(mockExtractRequestBody).not.toHaveBeenCalled();
	});

	test("should measure response time correctly", async () => {
		// Add artificial delay to test response time measurement
		app.get("/slow", async (c) => {
			await new Promise((resolve) => setTimeout(resolve, 50));
			return c.json({ message: "slow response" });
		});

		const response = await app.request("/slow");

		expect(response.status).toBe(200);

		if (mockAppLogger.request.mock.calls.length > 0) {
			const loggerCall = mockAppLogger.request.mock.calls[0];
			if (loggerCall && loggerCall.length > 1) {
				const responseTime = loggerCall[1];
				expect(responseTime).toBeTypeOf("number");
				expect(responseTime).toBeGreaterThan(0);
			}
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
		expect(mockShouldRecordRequest).toHaveBeenCalledTimes(methods.length);
	});

	test("should preserve request cloning for logging", async () => {
		mockAppEnv.LOG_REQUEST = true;
		mockShouldRecordRequest.mockReturnValue(true);

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
		expect(mockAppLogger.request).toHaveBeenCalled();
	});

	test("should handle requests with query parameters", async () => {
		const response = await app.request("/test?param1=value1&param2=value2");

		expect(response.status).toBe(200);
		expect(mockShouldRecordRequest).toHaveBeenCalledWith("/test");
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
		expect(mockGetClientIp).toHaveBeenCalled();
		expect(mockExtractHeaders).toHaveBeenCalled();
	});
});
