import {
	describe,
	test,
	expect,
	beforeEach,
	afterEach,
	beforeAll,
	afterAll,
} from "bun:test";
import { eq } from "drizzle-orm";
import db from "../drizzle";
import { observabilityEvents } from "../drizzle/schema/observability-events";
import { requestDetails as requestDetailsTable } from "../drizzle/schema/request-details";
import { users } from "../drizzle/schema/users";
import {
	storeObservabilityEvent,
	storeRequestDetails,
	extractRequestBody,
	extractResponseBody,
	type ObservabilityEventData,
	type RequestDetailsData,
} from "./observability-service";
import { hashPassword } from "../utils/passwordUtils";
import type { Context } from "hono";
import type HonoEnv from "../types/HonoEnv";
import appEnv from "../appEnv";

describe("ObservabilityService", () => {
	let testUser: typeof users.$inferSelect;

	// Store original environment values
	const originalValues = {
		OBSERVABILITY_ENABLED: appEnv.OBSERVABILITY_ENABLED,
		OBSERVABILITY_ANONYMIZE_USERS: appEnv.OBSERVABILITY_ANONYMIZE_USERS,
		OBSERVABILITY_MASK_SENSITIVE_DATA:
			appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA,
		OBSERVABILITY_STORE_REQUEST_BODIES:
			appEnv.OBSERVABILITY_STORE_REQUEST_BODIES,
		OBSERVABILITY_STORE_RESPONSE_BODIES:
			appEnv.OBSERVABILITY_STORE_RESPONSE_BODIES,
		OBSERVABILITY_MAX_BODY_SIZE: appEnv.OBSERVABILITY_MAX_BODY_SIZE,
	};

	beforeAll(async () => {
		// Create a test user for testing user-related functionality
		const hashedPassword = await hashPassword("testPassword123!");
		const result = await db
			.insert(users)
			.values({
				name: "_test_user_observability",
				username: "_test_user_observability",
				email: "_test_user_observability@example.com",
				password: hashedPassword,
				isEnabled: true,
			})
			.returning();

		if (!result || result.length === 0) {
			throw new Error(
				"Failed to create test user for observability tests.",
			);
		}
		testUser = result[0] as typeof users.$inferSelect;
	});

	afterAll(async () => {
		// Clean up test user
		await db
			.delete(users)
			.where(eq(users.username, "_test_user_observability"));
	});

	beforeEach(async () => {
		// Clean up test data before each test
		await db.delete(observabilityEvents);
		await db.delete(requestDetailsTable);

		// Reset environment values to defaults for testing
		// @ts-ignore - We need to override these for testing
		appEnv.OBSERVABILITY_ENABLED = true;
		// @ts-ignore
		appEnv.OBSERVABILITY_ANONYMIZE_USERS = false;
		// @ts-ignore
		appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA = true;
		// @ts-ignore
		appEnv.OBSERVABILITY_STORE_REQUEST_BODIES = true;
		// @ts-ignore
		appEnv.OBSERVABILITY_STORE_RESPONSE_BODIES = true;
		// @ts-ignore
		appEnv.OBSERVABILITY_MAX_BODY_SIZE = 10240;
	});

	afterEach(() => {
		// Restore original environment values
		// @ts-ignore
		appEnv.OBSERVABILITY_ENABLED = originalValues.OBSERVABILITY_ENABLED;
		// @ts-ignore
		appEnv.OBSERVABILITY_ANONYMIZE_USERS =
			originalValues.OBSERVABILITY_ANONYMIZE_USERS;
		// @ts-ignore
		appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA =
			originalValues.OBSERVABILITY_MASK_SENSITIVE_DATA;
		// @ts-ignore
		appEnv.OBSERVABILITY_STORE_REQUEST_BODIES =
			originalValues.OBSERVABILITY_STORE_REQUEST_BODIES;
		// @ts-ignore
		appEnv.OBSERVABILITY_STORE_RESPONSE_BODIES =
			originalValues.OBSERVABILITY_STORE_RESPONSE_BODIES;
		// @ts-ignore
		appEnv.OBSERVABILITY_MAX_BODY_SIZE =
			originalValues.OBSERVABILITY_MAX_BODY_SIZE;
	});

	describe("storeObservabilityEvent", () => {
		test("should store basic observability event successfully", async () => {
			const eventData: ObservabilityEventData = {
				eventType: "api_request",
				requestId: "test-request-123",
				userId: testUser.id,
				endpoint: "/api/users",
				method: "GET",
				statusCode: 200,
				responseTimeMs: 150,
			};

			await storeObservabilityEvent(eventData);

			const storedEvents = await db.select().from(observabilityEvents);
			expect(storedEvents).toHaveLength(1);

			const storedEvent =
				storedEvents[0] as typeof observabilityEvents.$inferSelect;
			expect(storedEvent.eventType).toBe("api_request");
			expect(storedEvent.requestId).toBe("test-request-123");
			expect(storedEvent.userId).toBe(testUser.id);
			expect(storedEvent.endpoint).toBe("/api/users");
			expect(storedEvent.method).toBe("GET");
			expect(storedEvent.statusCode).toBe(200);
			expect(storedEvent.responseTimeMs).toBe(150);
			expect(storedEvent.timestamp).toBeInstanceOf(Date);
		});

		test("should store frontend error event with error details", async () => {
			const eventData: ObservabilityEventData = {
				eventType: "frontend_error",
				requestId: "error-request-456",
				userId: testUser.id,
				endpoint: "/dashboard/users",
				errorMessage: "Failed to load user data",
				stackTrace:
					"Error: Failed to load user data\n    at UserComponent.tsx:45:12",
				metadata: {
					userAgent: "Mozilla/5.0...",
					url: "http://localhost:3000/dashboard/users",
					component: "UserList",
				},
			};

			await storeObservabilityEvent(eventData);

			const storedEvents = await db.select().from(observabilityEvents);
			expect(storedEvents).toHaveLength(1);

			const storedEvent =
				storedEvents[0] as typeof observabilityEvents.$inferSelect;
			expect(storedEvent.eventType).toBe("frontend_error");
			expect(storedEvent.errorMessage).toBe("Failed to load user data");
			expect(storedEvent.stackTrace).toContain("UserComponent.tsx:45:12");
			expect(storedEvent.metadata).toEqual({
				userAgent: "Mozilla/5.0...",
				url: "http://localhost:3000/dashboard/users",
				component: "UserList",
			});
		});

		test("should store frontend metric event", async () => {
			const eventData: ObservabilityEventData = {
				eventType: "frontend_metric",
				requestId: "metric-request-789",
				userId: testUser.id,
				endpoint: "/dashboard",
				metadata: {
					loadTime: 850,
					metricType: "page_load",
					route: "/dashboard",
					ttfb: 120,
					fcp: 650,
				},
			};

			await storeObservabilityEvent(eventData);

			const storedEvents = await db.select().from(observabilityEvents);
			expect(storedEvents).toHaveLength(1);

			const storedEvent =
				storedEvents[0] as typeof observabilityEvents.$inferSelect;
			expect(storedEvent.eventType).toBe("frontend_metric");
			expect(storedEvent.metadata).toEqual({
				loadTime: 850,
				metricType: "page_load",
				route: "/dashboard",
				ttfb: 120,
				fcp: 650,
			});
		});

		test("should anonymize user ID when OBSERVABILITY_ANONYMIZE_USERS is true", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_ANONYMIZE_USERS = true;

			const eventData: ObservabilityEventData = {
				eventType: "api_request",
				requestId: "anon-request-123",
				userId: testUser.id,
				endpoint: "/api/users",
				method: "GET",
				statusCode: 200,
			};

			await storeObservabilityEvent(eventData);

			const storedEvents = await db.select().from(observabilityEvents);
			expect(storedEvents).toHaveLength(1);

			const storedEvent =
				storedEvents[0] as typeof observabilityEvents.$inferSelect;
			expect(storedEvent.userId).toBeNull();
			expect(storedEvent.requestId).toBe("anon-request-123");
		});

		test("should not store event when OBSERVABILITY_ENABLED is false", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_ENABLED = false;

			const eventData: ObservabilityEventData = {
				eventType: "api_request",
				requestId: "disabled-request-123",
				userId: testUser.id,
				endpoint: "/api/users",
				method: "GET",
				statusCode: 200,
			};

			await storeObservabilityEvent(eventData);

			const storedEvents = await db.select().from(observabilityEvents);
			expect(storedEvents).toHaveLength(0);
		});

		test("should handle storage errors gracefully", async () => {
			const eventData: ObservabilityEventData = {
				eventType: "api_request",
				requestId: "error-request-123",
				userId: "invalid-user-id-that-causes-error",
				endpoint: "/api/users",
				method: "GET",
				statusCode: 200,
			};

			// This should not throw an error even if database operation fails
			await expect(
				storeObservabilityEvent(eventData),
			).resolves.toBeUndefined();
		});

		test("should handle null and undefined values correctly", async () => {
			const eventData: ObservabilityEventData = {
				eventType: "api_request",
				requestId: "null-values-request-123",
				userId: null,
				endpoint: "/api/public",
				method: undefined,
				statusCode: undefined,
				responseTimeMs: undefined,
				errorMessage: undefined,
				stackTrace: undefined,
				metadata: undefined,
			};

			await storeObservabilityEvent(eventData);

			const storedEvents = await db.select().from(observabilityEvents);
			expect(storedEvents).toHaveLength(1);

			const storedEvent =
				storedEvents[0] as typeof observabilityEvents.$inferSelect;
			expect(storedEvent.userId).toBeNull();
			expect(storedEvent.method).toBeNull();
			expect(storedEvent.statusCode).toBeNull();
			expect(storedEvent.responseTimeMs).toBeNull();
			expect(storedEvent.errorMessage).toBeNull();
			expect(storedEvent.stackTrace).toBeNull();
			expect(storedEvent.metadata).toBeNull();
		});
	});

	describe("storeRequestDetails", () => {
		test("should store complete request details successfully", async () => {
			const detailsData: RequestDetailsData = {
				requestId: "details-request-123",
				userId: testUser.id,
				method: "POST",
				endpoint: "/api/users",
				queryParams: { page: 1, limit: 10 },
				requestBody: { name: "John Doe", email: "john@example.com" },
				responseBody: {
					id: 1,
					name: "John Doe",
					email: "john@example.com",
				},
				requestHeaders: {
					"content-type": "application/json",
					authorization: "Bearer token123",
				},
				responseHeaders: {
					"content-type": "application/json",
					"x-response-time": "150ms",
				},
				ipAddress: "192.168.1.100",
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			expect(storedDetail.requestId).toBe("details-request-123");
			expect(storedDetail.userId).toBe(testUser.id);
			expect(storedDetail.method).toBe("POST");
			expect(storedDetail.endpoint).toBe("/api/users");
			expect(storedDetail.queryParams).toEqual({ page: 1, limit: 10 });
			expect(storedDetail.requestBody).toEqual({
				name: "John Doe",
				email: "john@example.com",
			});
			expect(storedDetail.responseBody).toEqual({
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			});
			expect(storedDetail.ipAddress).toBe("192.168.1.100");
			expect(storedDetail.userAgent).toBe(
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			);
		});

		test("should sanitize sensitive data in headers and body", async () => {
			const detailsData: RequestDetailsData = {
				requestId: "sensitive-request-123",
				userId: testUser.id,
				method: "POST",
				endpoint: "/api/auth/login",
				requestBody: {
					username: "john@example.com",
					password: "secret123",
					apiKey: "api-key-123",
				},
				requestHeaders: {
					"content-type": "application/json",
					authorization: "Bearer sensitive-token-123",
					"x-api-key": "secret-key-456",
				},
				responseHeaders: {
					"set-cookie": "session=abc123; HttpOnly",
					authorization: "Bearer new-token-789",
				},
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			const requestBody = storedDetail.requestBody as Record<
				string,
				unknown
			>;
			const requestHeaders = storedDetail.requestHeaders as Record<
				string,
				unknown
			>;
			const responseHeaders = storedDetail.responseHeaders as Record<
				string,
				unknown
			>;

			// Check that sensitive fields are masked
			expect(requestBody.username).toBe("john@example.com");
			expect(requestBody.password).toBe("[MASKED]");
			expect(requestBody.apiKey).toBe("[MASKED]");
			expect(requestHeaders["content-type"]).toBe("application/json");
			expect(requestHeaders.authorization).toBe("[MASKED]");
			expect(responseHeaders.authorization).toBe("[MASKED]");
		});

		test("should anonymize user ID when OBSERVABILITY_ANONYMIZE_USERS is true", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_ANONYMIZE_USERS = true;

			const detailsData: RequestDetailsData = {
				requestId: "anon-details-request-123",
				userId: testUser.id,
				method: "GET",
				endpoint: "/api/users",
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			expect(storedDetail.userId).toBeNull();
			expect(storedDetail.requestId).toBe("anon-details-request-123");
		});

		test("should not store request bodies when OBSERVABILITY_STORE_REQUEST_BODIES is false", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_STORE_REQUEST_BODIES = false;

			const detailsData: RequestDetailsData = {
				requestId: "no-req-body-123",
				userId: testUser.id,
				method: "POST",
				endpoint: "/api/users",
				requestBody: { name: "John Doe", email: "john@example.com" },
				responseBody: { id: 1, name: "John Doe" },
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			expect(storedDetail.requestBody).toBeNull();
			expect(storedDetail.responseBody).toEqual({
				id: 1,
				name: "John Doe",
			});
		});

		test("should not store response bodies when OBSERVABILITY_STORE_RESPONSE_BODIES is false", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_STORE_RESPONSE_BODIES = false;

			const detailsData: RequestDetailsData = {
				requestId: "no-res-body-123",
				userId: testUser.id,
				method: "POST",
				endpoint: "/api/users",
				requestBody: { name: "John Doe", email: "john@example.com" },
				responseBody: { id: 1, name: "John Doe" },
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			expect(storedDetail.requestBody).toEqual({
				name: "John Doe",
				email: "john@example.com",
			});
			expect(storedDetail.responseBody).toBeNull();
		});

		test("should truncate large request/response bodies", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_MAX_BODY_SIZE = 50; // Very small size for testing

			const largeBody = { data: "x".repeat(100) }; // This will exceed the limit

			const detailsData: RequestDetailsData = {
				requestId: "large-body-123",
				userId: testUser.id,
				method: "POST",
				endpoint: "/api/users",
				requestBody: largeBody,
				responseBody: largeBody,
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			const requestBody = storedDetail.requestBody as string;
			const responseBody = storedDetail.responseBody as string;

			expect(requestBody).toContain("[TRUNCATED");
			expect(responseBody).toContain("[TRUNCATED");
		});

		test("should not store details when OBSERVABILITY_ENABLED is false", async () => {
			// @ts-ignore
			appEnv.OBSERVABILITY_ENABLED = false;

			const detailsData: RequestDetailsData = {
				requestId: "disabled-details-123",
				userId: testUser.id,
				method: "GET",
				endpoint: "/api/users",
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(0);
		});

		test("should handle storage errors gracefully", async () => {
			// Create invalid data that might cause database errors
			const detailsData: RequestDetailsData = {
				requestId: "error-details-123",
				userId: "invalid-user-id-that-causes-error",
				method: "GET",
				endpoint: "/api/users",
			};

			// This should not throw an error even if database operation fails
			await expect(
				storeRequestDetails(detailsData),
			).resolves.toBeUndefined();
		});

		test("should handle null and undefined values correctly", async () => {
			const detailsData: RequestDetailsData = {
				requestId: "null-details-123",
				userId: null,
				method: "GET",
				endpoint: "/api/public",
				queryParams: undefined,
				requestBody: undefined,
				responseBody: undefined,
				requestHeaders: undefined,
				responseHeaders: undefined,
				ipAddress: null,
				userAgent: null,
			};

			await storeRequestDetails(detailsData);

			const storedDetails = await db.select().from(requestDetailsTable);
			expect(storedDetails).toHaveLength(1);

			const storedDetail =
				storedDetails[0] as typeof requestDetailsTable.$inferSelect;
			expect(storedDetail.userId).toBeNull();
			expect(storedDetail.queryParams).toBeNull();
			expect(storedDetail.requestBody).toBeNull();
			expect(storedDetail.responseBody).toBeNull();
			expect(storedDetail.requestHeaders).toBeNull();
			expect(storedDetail.responseHeaders).toBeNull();
			expect(storedDetail.ipAddress).toBeNull();
			expect(storedDetail.userAgent).toBeNull();
		});
	});

	describe("extractRequestBody", () => {
		test("should extract JSON request body", async () => {
			const mockRequest = {
				header: (name: string) => {
					if (name === "content-type") return "application/json";
					return null;
				},
				json: async () => ({ name: "John", age: 30 }),
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toEqual({ name: "John", age: 30 });
		});

		test("should extract form data request body", async () => {
			const formData = new FormData();
			formData.append("name", "John");
			formData.append("age", "30");

			const mockRequest = {
				header: (name: string) => {
					if (name === "content-type")
						return "application/x-www-form-urlencoded";
					return null;
				},
				formData: async () => formData,
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toEqual({ name: "John", age: "30" });
		});

		test("should extract text request body", async () => {
			const mockRequest = {
				header: (name: string) => {
					if (name === "content-type") return "text/plain";
					return null;
				},
				text: async () => "This is plain text content",
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toBe("This is plain text content");
		});

		test("should return null for unsupported content types", async () => {
			const mockRequest = {
				header: (name: string) => {
					if (name === "content-type") return "image/jpeg";
					return null;
				},
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toBeNull();
		});

		test("should return null when no content-type header", async () => {
			const mockRequest = {
				header: () => null,
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toBeNull();
		});

		test("should return null when body extraction fails", async () => {
			const mockRequest = {
				header: (name: string) => {
					if (name === "content-type") return "application/json";
					return null;
				},
				json: async () => {
					throw new Error("Invalid JSON");
				},
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toBeNull();
		});

		test("should handle GET requests with no body", async () => {
			const mockRequest = {
				header: () => null,
			};

			const mockContext = {
				req: mockRequest,
			} as unknown as Context<HonoEnv>;

			const result = await extractRequestBody(mockContext);
			expect(result).toBeNull();
		});
	});

	describe("extractResponseBody", () => {
		test("should extract JSON response body", async () => {
			const response = new Response(
				JSON.stringify({
					success: true,
					data: { id: 1, name: "John" },
				}),
				{
					headers: { "content-type": "application/json" },
				},
			);

			const result = await extractResponseBody(response);
			expect(result).toEqual({
				success: true,
				data: { id: 1, name: "John" },
			});
		});

		test("should extract text response body", async () => {
			const response = new Response("Success message", {
				headers: { "content-type": "text/plain" },
			});

			const result = await extractResponseBody(response);
			expect(result).toBe("Success message");
		});

		test("should return null for unsupported content types", async () => {
			const response = new Response("binary data", {
				headers: { "content-type": "image/png" },
			});

			const result = await extractResponseBody(response);
			expect(result).toBeNull();
		});

		test("should return null when no content-type header", async () => {
			const response = new Response("some data");

			const result = await extractResponseBody(response);
			expect(result).toBeNull();
		});

		test("should return null when body extraction fails", async () => {
			const response = new Response("invalid json {", {
				headers: { "content-type": "application/json" },
			});

			const result = await extractResponseBody(response);
			expect(result).toBeNull();
		});

		test("should not consume original response body", async () => {
			const originalBody = JSON.stringify({ test: "data" });
			const response = new Response(originalBody, {
				headers: { "content-type": "application/json" },
			});

			// Extract body using the function
			const result = await extractResponseBody(response);
			expect(result).toEqual({ test: "data" });

			// Original response should still be readable
			const originalResult = await response.json();
			expect(originalResult).toEqual({ test: "data" });
		});

		test("should handle empty response body", async () => {
			const response = new Response('""', {
				headers: { "content-type": "application/json" },
			});

			const result = await extractResponseBody(response);
			expect(result).toBe("");
		});

		test("should handle HTML response body", async () => {
			const response = new Response("<html><body>Hello</body></html>", {
				headers: { "content-type": "text/html" },
			});

			const result = await extractResponseBody(response);
			expect(result).toBe("<html><body>Hello</body></html>");
		});
	});

	describe("Integration Tests", () => {
		test("should store complete observability flow", async () => {
			const requestId = "integration-test-123";

			// Store observability event
			const eventData: ObservabilityEventData = {
				eventType: "api_request",
				requestId,
				userId: testUser.id,
				endpoint: "/api/users",
				method: "POST",
				statusCode: 201,
				responseTimeMs: 245,
			};

			await storeObservabilityEvent(eventData);

			// Store request details
			const detailsData: RequestDetailsData = {
				requestId,
				userId: testUser.id,
				method: "POST",
				endpoint: "/api/users",
				queryParams: { includeProfile: true },
				requestBody: { name: "Jane Doe", email: "jane@example.com" },
				responseBody: {
					id: 2,
					name: "Jane Doe",
					email: "jane@example.com",
				},
				ipAddress: "192.168.1.101",
				userAgent: "Test User Agent",
			};

			await storeRequestDetails(detailsData);

			// Verify both records exist and are linked by requestId
			const events = await db
				.select()
				.from(observabilityEvents)
				.where(eq(observabilityEvents.requestId, requestId));
			const details = await db
				.select()
				.from(requestDetailsTable)
				.where(eq(requestDetailsTable.requestId, requestId));

			expect(events).toHaveLength(1);
			expect(details).toHaveLength(1);

			const event = events[0] as typeof observabilityEvents.$inferSelect;
			const detail =
				details[0] as typeof requestDetailsTable.$inferSelect;

			expect(event.requestId).toBe(detail.requestId);
			expect(event.userId).toBe(detail.userId);
			expect(event.endpoint).toBe(detail.endpoint);
			expect(event.method).toBe(detail.method);
		});

		test("should handle concurrent operations correctly", async () => {
			const promises = [];

			// Create multiple concurrent operations
			for (let i = 0; i < 10; i++) {
				const eventData: ObservabilityEventData = {
					eventType: "api_request",
					requestId: `concurrent-request-${i}`,
					userId: testUser.id,
					endpoint: `/api/test/${i}`,
					method: "GET",
					statusCode: 200,
				};

				const detailsData: RequestDetailsData = {
					requestId: `concurrent-request-${i}`,
					userId: testUser.id,
					method: "GET",
					endpoint: `/api/test/${i}`,
				};

				promises.push(storeObservabilityEvent(eventData));
				promises.push(storeRequestDetails(detailsData));
			}

			await Promise.all(promises);

			const events = await db.select().from(observabilityEvents);
			const details = await db.select().from(requestDetailsTable);

			expect(events).toHaveLength(10);
			expect(details).toHaveLength(10);

			// Verify all request IDs are unique
			const eventRequestIds = events.map((e) => e.requestId);
			const detailRequestIds = details.map((d) => d.requestId);

			expect(new Set(eventRequestIds).size).toBe(10);
			expect(new Set(detailRequestIds).size).toBe(10);
		});
	});
});
