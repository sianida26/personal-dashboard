import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { testClient } from "hono/testing";
import { appRoutes } from "../../index";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { requestDetails } from "../../drizzle/schema/request-details";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";
import { sign } from "jsonwebtoken";
import appEnv from "../../appEnv";
import { readFileSync } from "fs";

describe("Observability API Endpoints", () => {
	const client = testClient(appRoutes);
	let superAdminToken: string;
	let limitedUserToken: string;
	let privateKey: string;

	beforeAll(async () => {
		// Read private key from file
		privateKey = readFileSync(appEnv.PRIVATE_KEY_PATH, 'utf8');
		
		// Get super admin user by username
		const superAdmin = await db.query.users.findFirst({
			where: eq(users.username, "superadmin"),
		});

		if (!superAdmin) {
			throw new Error("Super admin user not found");
		}

		// Create JWT token for super admin
		superAdminToken = sign(
			{ sub: superAdmin.id, uid: superAdmin.id },
			privateKey,
			{ algorithm: "RS256" },
		);

		// Create a test user with limited permissions for permission testing
		const [limitedUser] = await db.insert(users).values({
			username: "test-limited-user",
			name: "Test Limited User",
			isEnabled: true,
		}).returning();

		if (!limitedUser) {
			throw new Error("Failed to create limited user");
		}

		// Create JWT token for limited user (no observability permissions)
		limitedUserToken = sign(
			{ sub: limitedUser.id, uid: limitedUser.id },
			privateKey,
			{ algorithm: "RS256" },
		);
	});

	afterAll(async () => {
		// Cleanup test data
		await db.delete(observabilityEvents);
		await db.delete(requestDetails);
		
		// Cleanup test users
		await db.delete(users).where(eq(users.username, "test-limited-user"));
	});

	test("GET /observability/events should return 200", async () => {
		const response = await client.observability.events.$get(
			{
				query: {}
			},
			{
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty("data");
		expect(data).toHaveProperty("_metadata");
	});

	test("GET /observability/requests should return 200", async () => {
		const response = await client.observability.requests.$get(
			{
				query: {}
			},
			{
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty("data");
		expect(data).toHaveProperty("_metadata");
	});

	test("GET /observability/metrics should return 200", async () => {
		const response = await client.observability.metrics.$get(
			{
				query: {}
			},
			{
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty("data");
		expect(data.data).toHaveProperty("overview");
		expect(data.data).toHaveProperty("statusCodeDistribution");
		expect(data.data).toHaveProperty("topEndpoints");
		expect(data.data).toHaveProperty("timeSeries");
		expect(data.data).toHaveProperty("errorsByType");
	});

	test("POST /observability/frontend should create frontend event", async () => {
		const eventData = {
			eventType: "frontend_error" as const,
			errorMessage: "Test error",
			stackTrace: "Error stack trace",
			route: "/test-route",
			metadata: {
				userAgent: "test-agent",
				timestamp: Date.now(),
			},
		};

		const response = await client.observability.frontend.$post(
			{ json: eventData },
			{
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
					"Content-Type": "application/json",
				},
			},
		);

		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data).toHaveProperty("data");
		expect(data.data).toHaveProperty("id");
		expect(data.data).toHaveProperty("message");
	});

	test("DELETE /observability/cleanup should work with dry run", async () => {
		const response = await client.observability.cleanup.$delete(
			{
				query: {
					retentionDays: "30",
					dryRun: "true",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty("data");
		expect(data.data).toHaveProperty("dryRun");
		expect(data.data.dryRun).toBe(true);
		expect(data.data).toHaveProperty("eventsToDelete");
		expect(data.data).toHaveProperty("requestsToDelete");
	});

	test("GET /observability/events should support filtering", async () => {
		const response = await client.observability.events.$get(
			{
				query: {
					eventType: "frontend_error",
					page: "1",
					limit: "10",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
				},
			},
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty("data");
		expect(data).toHaveProperty("_metadata");
		expect(data._metadata).toHaveProperty("currentPage");
		expect(data._metadata.currentPage).toBe(1);
	});

	test("Should require authentication", async () => {
		const response = await client.observability.events.$get({
			query: {}
		});

		expect(response.status).toBe(401);
	});

	test("Should require proper permissions", async () => {
		// Use the limited user token (user without observability permissions)
		const response = await client.observability.events.$get(
			{
				query: {}
			},
			{
				headers: {
					Authorization: `Bearer ${limitedUserToken}`,
				},
			},
		);

		expect(response.status).toBe(403);
	});
});
