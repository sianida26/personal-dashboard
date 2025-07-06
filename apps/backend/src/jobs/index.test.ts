import { beforeEach, describe, expect, it } from "bun:test";
import type { JobHandler } from "../services/jobs/types";
import { JobHandlerRegistry } from ".";

describe("JobHandlerRegistry", () => {
	let registry: JobHandlerRegistry;

	beforeEach(() => {
		registry = new JobHandlerRegistry();
	});

	const mockHandler: JobHandler = {
		type: "test-handler",
		description: "Test handler for unit tests",
		defaultMaxRetries: 3,
		defaultTimeoutSeconds: 30,
		async execute(_payload, _context) {
			return {
				success: true,
				message: "Test executed successfully",
			};
		},
	};

	it("should register a job handler", () => {
		registry.register(mockHandler);
		expect(registry.has("test-handler")).toBe(true);
		expect(registry.get("test-handler")).toBe(mockHandler);
	});

	it("should throw error when registering duplicate handler", () => {
		registry.register(mockHandler);
		expect(() => registry.register(mockHandler)).toThrow(
			"Job handler for type 'test-handler' already registered",
		);
	});

	it("should get all registered types", () => {
		registry.register(mockHandler);
		const types = registry.getTypes();
		expect(types).toContain("test-handler");
		expect(types.length).toBe(1);
	});

	it("should get all registered handlers", () => {
		registry.register(mockHandler);
		const handlers = registry.getHandlers();
		expect(handlers).toContain(mockHandler);
		expect(handlers.length).toBe(1);
	});

	it("should unregister a handler", () => {
		registry.register(mockHandler);
		expect(registry.has("test-handler")).toBe(true);

		const removed = registry.unregister("test-handler");
		expect(removed).toBe(true);
		expect(registry.has("test-handler")).toBe(false);
	});

	it("should return false when unregistering non-existent handler", () => {
		const removed = registry.unregister("non-existent");
		expect(removed).toBe(false);
	});

	it("should clear all handlers", () => {
		registry.register(mockHandler);
		expect(registry.getTypes().length).toBe(1);

		registry.clear();
		expect(registry.getTypes().length).toBe(0);
	});

	it("should return undefined for non-existent handler", () => {
		const handler = registry.get("non-existent");
		expect(handler).toBeUndefined();
	});
});
