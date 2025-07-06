import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { inArray } from "drizzle-orm";
import db from "../../drizzle";
import { requestDetails } from "../../drizzle/schema/request-details";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import {
	createUserForTesting,
	cleanupTestUser,
	type TestUserData,
} from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/test-utils/hono-test-client";

describe("GET /observability/analytics", () => {
	let testUser: TestUserData;
	const testRequestIds: string[] = [];

	beforeAll(async () => {
		// Create test user with observability permissions
		testUser = await createUserForTesting({
			name: "Test User - Analytics",
			username: "test-user-analytics",
			permissions: ["observability.read"],
		});

		// Create some test request data
		const currentTime = Date.now();
		const testRequests = [
			{
				requestId: `test-req-${currentTime}-1`,
				endpoint: "/api/test",
				method: "GET",
				statusCode: 200,
				responseTime: 150,
			},
			{
				requestId: `test-req-${currentTime}-2`,
				endpoint: "/api/test",
				method: "GET",
				statusCode: 200,
				responseTime: 250,
			},
			{
				requestId: `test-req-${currentTime}-3`,
				endpoint: "/api/test",
				method: "POST",
				statusCode: 400,
				responseTime: 100,
			},
			{
				requestId: `test-req-${currentTime}-4`,
				endpoint: "/api/slow",
				method: "GET",
				statusCode: 200,
				responseTime: 2000, // High response time to test binning
			},
		];

		// Insert request details
		for (const req of testRequests) {
			await db.insert(requestDetails).values({
				requestId: req.requestId,
				userId: testUser.user.id,
				method: req.method,
				endpoint: req.endpoint,
				routePath: req.endpoint,
				ipAddress: "127.0.0.1",
				userAgent: "test-agent",
				createdAt: new Date(),
			});

			await db.insert(observabilityEvents).values({
				requestId: req.requestId,
				eventType: "api_request",
				statusCode: req.statusCode,
				responseTimeMs: req.responseTime,
				createdAt: new Date(),
			});

			testRequestIds.push(req.requestId);
		}
	});

	afterAll(async () => {
		// Clean up test data
		await db
			.delete(observabilityEvents)
			.where(inArray(observabilityEvents.requestId, testRequestIds));

		await db
			.delete(requestDetails)
			.where(inArray(requestDetails.requestId, testRequestIds));

		await cleanupTestUser(testUser.user.id);
	});

	it("should return analytics data with histogram binning", async () => {
		const response = await client.observability.analytics.$get(
			{
				query: {
					endpoint: "/api/test",
					method: "GET",
					limit: "100",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);

		const data = await response.json();

		// Check that the response has the expected structure
		expect(data).toHaveProperty("data");
		expect(data).toHaveProperty("statistics");
		expect(data).toHaveProperty("histogram");
		expect(data).toHaveProperty("_metadata");

		// Check statistics structure
		expect(data.statistics).toHaveProperty("totalRequests");
		expect(data.statistics).toHaveProperty("avgResponseTime");
		expect(data.statistics).toHaveProperty("maxResponseTime");
		expect(data.statistics).toHaveProperty("medianResponseTime");
		expect(data.statistics).toHaveProperty("p95ResponseTime");
		expect(data.statistics).toHaveProperty("successRate");
		expect(data.statistics).toHaveProperty("statusCounts");

		// Check histogram structure
		expect(Array.isArray(data.histogram)).toBe(true);
		if (data.histogram.length > 0) {
			const histogramItem = data.histogram[0];
			expect(histogramItem).toHaveProperty("range");
			expect(histogramItem).toHaveProperty("binStart");
			expect(histogramItem).toHaveProperty("binSize");
			expect(histogramItem).toHaveProperty("2xx");
			expect(histogramItem).toHaveProperty("3xx");
			expect(histogramItem).toHaveProperty("4xx");
			expect(histogramItem).toHaveProperty("5xx");
		}

		// Check metadata
		const metadata = (
			data as {
				_metadata: {
					binSize: number;
					granularity: string;
					totalBins: number;
				};
			}
		)._metadata;
		expect(metadata).toHaveProperty("binSize");
		expect(metadata).toHaveProperty("granularity");
		expect(metadata).toHaveProperty("totalBins");
	});

	it("should use adaptive binning based on max response time", async () => {
		// Test with high response times (should use 5ms bins)
		const response = await client.observability.analytics.$get(
			{
				query: {
					endpoint: "/api/slow",
					method: "GET",
					limit: "100",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		// Check that appropriate binning is used
		const metadata = (
			data as {
				_metadata: {
					binSize: number;
					granularity: string;
					totalBins: number;
				};
			}
		)._metadata;
		expect(metadata).toHaveProperty("binSize");
		expect(metadata).toHaveProperty("granularity");
		expect(typeof metadata.binSize).toBe("number");
		expect(typeof metadata.granularity).toBe("string");

		// For response time > 1000ms, should use 5ms bins
		expect(metadata.binSize).toBe(5);
		expect(metadata.granularity).toBe("5ms");
	});

	it("should filter by endpoint and method", async () => {
		// Test filtering by specific endpoint and method
		const response = await client.observability.analytics.$get(
			{
				query: {
					endpoint: "/api/test",
					method: "POST",
					limit: "100",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();

		// Verify that all returned data matches the filter
		data.data.forEach((item: { endpoint: string; method: string }) => {
			expect(item.endpoint).toBe("/api/test");
			expect(item.method).toBe("POST");
		});
	});

	it("should return 422 for invalid date format", async () => {
		const response = await client.observability.analytics.$get(
			{
				query: {
					endpoint: "/api/test",
					method: "GET",
					startDate: "invalid-date",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${testUser.accessToken}`,
				},
			},
		);

		expect(response.status).toBe(422);
	});

	it("should return 401 for unauthenticated request", async () => {
		const response = await client.observability.analytics.$get({
			query: {
				endpoint: "/api/test",
				method: "GET",
			},
		});

		expect(response.status).toBe(401);
	});
});
