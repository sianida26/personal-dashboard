import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import db from "../drizzle";
import { observabilityEvents } from "../drizzle/schema/observability-events";
import { requestDetails as requestDetailsTable } from "../drizzle/schema/request-details";
import enhancedRequestLogger from "./enhanced-request-logger";
import type HonoEnv from "../types/HonoEnv";
import { eq } from "drizzle-orm";

describe("Enhanced Request Logger Integration", () => {
	let app: Hono<HonoEnv>;

	beforeEach(async () => {
		// Clean up any existing test data
		await db
			.delete(observabilityEvents)
			.where(
				eq(observabilityEvents.requestId, "test-request-integration"),
			);
		await db
			.delete(requestDetailsTable)
			.where(
				eq(requestDetailsTable.requestId, "test-request-integration"),
			);

		// Create fresh app instance
		app = new Hono<HonoEnv>();
		app.use(enhancedRequestLogger);
		app.get("/integration-test", (c) => {
			// Set a predictable request ID for testing
			c.set("requestId", "test-request-integration");
			return c.json({ message: "integration test" });
		});
	});

	afterEach(async () => {
		// Clean up test data
		await db
			.delete(observabilityEvents)
			.where(
				eq(observabilityEvents.requestId, "test-request-integration"),
			);
		await db
			.delete(requestDetailsTable)
			.where(
				eq(requestDetailsTable.requestId, "test-request-integration"),
			);
	});

	test("should work end-to-end without errors", async () => {
		const response = await app.request("/integration-test");

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ message: "integration test" });

		// Give some time for async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		// This test just verifies the middleware doesn't break the application
		// The actual observability data recording depends on configuration
	});

	test("should handle POST requests with body", async () => {
		app.post("/integration-test-post", (c) => {
			c.set("requestId", "test-request-integration");
			return c.json({ received: true });
		});

		const response = await app.request("/integration-test-post", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ test: "data" }),
		});

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ received: true });
	});

	test("should handle errors gracefully", async () => {
		app.get("/integration-test-error", (c) => {
			c.set("requestId", "test-request-integration");
			throw new Error("Test error");
		});

		const response = await app.request("/integration-test-error");

		// The middleware should not interfere with error handling
		expect(response.status).toBe(500);
	});

	test("should preserve request ID in context", async () => {
		let capturedRequestId: string | undefined;

		app.get("/integration-test-capture", (c) => {
			capturedRequestId = c.var.requestId;
			return c.json({ requestId: capturedRequestId });
		});

		const response = await app.request("/integration-test-capture");

		expect(response.status).toBe(200);
		expect(capturedRequestId).toBeDefined();
		expect(typeof capturedRequestId).toBe("string");
	});
});
