import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { ChannelDeliveryRequest } from "../../src/modules/notifications/channels/types";
import { WhatsAppChannelAdapter } from "../../src/modules/notifications/channels/whatsapp-adapter";
import jobQueueManager from "../../src/services/jobs/queue-manager";
import whatsappService from "../../src/services/whatsapp/whatsapp-service";

// Store original functions
const originalCreateJob = jobQueueManager.createJob;
const originalIsReady = whatsappService.isReady;
let mockCreateJobCalls: unknown[][] = [];
let mockCreateJobResponse: string | Error = "test-job-id";
let mockWhatsAppIsReady = true;

describe("WhatsAppChannelAdapter", () => {
	let adapter: WhatsAppChannelAdapter;

	beforeEach(() => {
		adapter = new WhatsAppChannelAdapter();
		mockCreateJobCalls = [];
		mockCreateJobResponse = "test-job-id";
		mockWhatsAppIsReady = true;

		// Replace with mocks
		jobQueueManager.createJob = (async (options: unknown) => {
			mockCreateJobCalls.push([options]);
			if (mockCreateJobResponse instanceof Error) {
				throw mockCreateJobResponse;
			}
			return mockCreateJobResponse;
		}) as typeof originalCreateJob;

		whatsappService.isReady = () => mockWhatsAppIsReady;
	});

	afterEach(() => {
		// Restore originals
		jobQueueManager.createJob = originalCreateJob;
		whatsappService.isReady = originalIsReady;
		mockCreateJobCalls = [];
	});

	it("should schedule whatsapp notification for valid recipients with phone numbers", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test WhatsApp",
				message: "This is a test WhatsApp notification",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(1);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "scheduled",
			jobId: "test-job-id",
		});
	});

	it("should skip recipients without phone numbers", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: null,
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test WhatsApp",
				message: "This should be skipped",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "skipped",
			reason: "No phone number available",
		});
	});

	it("should fail all recipients when WhatsApp service is not configured", async () => {
		mockWhatsAppIsReady = false;

		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Service not ready",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "failed",
			reason: "WhatsApp service not configured",
		});
	});

	it("should create separate job for each unique recipient", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "User 1",
					email: "user1@example.com",
					phoneNumber: "081234567890",
				},
				{
					userId: "user-2",
					name: "User 2",
					email: "user2@example.com",
					phoneNumber: "081234567891",
				},
			],
			request: {
				userIds: ["user-1", "user-2"],
				category: "general",
				title: "Test",
				message: "Multi-user notification",
			},
		};

		const result = await adapter.deliver(request);

		// Should create 2 jobs (one per recipient)
		expect(mockCreateJobCalls).toHaveLength(2);
		expect(result).toHaveLength(2);
		expect(result.every((r) => r.status === "scheduled")).toBe(true);
	});

	it("should deduplicate recipients by userId", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "User 1",
					email: "user1@example.com",
					phoneNumber: "081234567890",
				},
				{
					userId: "user-1", // Duplicate
					name: "User 1",
					email: "user1@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userIds: ["user-1"],
				category: "general",
				title: "Test",
				message: "Deduplication test",
			},
		};

		const result = await adapter.deliver(request);

		// Should only create 1 job (deduplicated)
		expect(mockCreateJobCalls).toHaveLength(1);
		expect(result).toHaveLength(1);
	});

	it("should use phone number from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Override phone test",
				channelOverrides: {
					whatsapp: {
						phoneNumber: "081999999999",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { phoneNumber: string };
		};
		expect(jobCall.payload.phoneNumber).toBe("081999999999");
	});

	it("should use phone number from metadata if not in override or recipient", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: null,
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Metadata phone test",
				metadata: {
					phoneNumber: "081234567890",
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { phoneNumber: string };
		};
		expect(jobCall.payload.phoneNumber).toBe("081234567890");
	});

	it("should use contactPhone from metadata as fallback", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: null,
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Contact phone test",
				metadata: {
					contactPhone: "081234567890",
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { phoneNumber: string };
		};
		expect(jobCall.payload.phoneNumber).toBe("081234567890");
	});

	it("should skip recipient when no message is provided", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "", // Empty message
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "skipped",
			reason: "No message content provided",
		});
	});

	it("should use message from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Default message",
				channelOverrides: {
					whatsapp: {
						message: "Override message",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { message: string };
		};
		expect(jobCall.payload.message).toBe("Override message");
	});

	it("should include session from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Session test",
				channelOverrides: {
					whatsapp: {
						session: "custom-session",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { session: string };
		};
		expect(jobCall.payload.session).toBe("custom-session");
	});

	it("should include linkPreview from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Link preview test",
				channelOverrides: {
					whatsapp: {
						linkPreview: false,
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { linkPreview: boolean };
		};
		expect(jobCall.payload.linkPreview).toBe(false);
	});

	it("should include linkPreviewHighQuality from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "High quality preview test",
				channelOverrides: {
					whatsapp: {
						linkPreviewHighQuality: true,
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { linkPreviewHighQuality: boolean };
		};
		expect(jobCall.payload.linkPreviewHighQuality).toBe(true);
	});

	it("should include metadata with category and eventType", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "system",
				title: "Test",
				message: "Metadata test",
				eventType: "user.created",
				metadata: {
					customKey: "customValue",
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { metadata: Record<string, unknown> };
		};
		expect(jobCall.payload.metadata).toMatchObject({
			category: "system",
			eventType: "user.created",
			customKey: "customValue",
		});
	});

	it("should merge metadata from request and override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Metadata merge test",
				metadata: {
					requestKey: "requestValue",
				},
				channelOverrides: {
					whatsapp: {
						metadata: {
							overrideKey: "overrideValue",
						},
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { metadata: Record<string, unknown> };
		};
		expect(jobCall.payload.metadata).toMatchObject({
			requestKey: "requestValue",
			overrideKey: "overrideValue",
		});
	});

	it("should map priority correctly to job priority", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Priority test",
				message: "High priority message",
				jobOptions: {
					priority: 1, // Should map to "high"
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { priority: string };
		expect(jobCall.priority).toBe("high");
	});

	it("should default priority to normal when not specified", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Normal priority",
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { priority: string };
		expect(jobCall.priority).toBe("normal");
	});

	it("should handle job creation failure", async () => {
		mockCreateJobResponse = new Error("Job queue is full");

		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "This should fail",
			},
		};

		const result = await adapter.deliver(request);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "failed",
			reason: "Job queue is full",
		});
	});

	it("should return empty array for wrong channel", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email", // Wrong channel
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Wrong channel",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(0);
	});

	it("should return empty array for empty recipients", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "No recipients",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(0);
	});

	it("should set correct job type", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Job type test",
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { type: string };
		expect(jobCall.type).toBe("whatsapp-notification");
	});

	it("should respect maxRetries from jobOptions", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Max retries test",
				jobOptions: {
					maxRetries: 3,
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { maxRetries: number };
		expect(jobCall.maxRetries).toBe(3);
	});

	it("should trim whitespace from phone numbers", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "  081234567890  ",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Trim test",
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { phoneNumber: string };
		};
		expect(jobCall.payload.phoneNumber).toBe("081234567890");
	});

	it("should skip recipient with empty string phone number after trim", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "   ",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Empty phone test",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "skipped",
			reason: "No phone number available",
		});
	});

	it("should skip recipient with empty string message after trim from override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "test@example.com",
					phoneNumber: "081234567890",
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test",
				message: "Default message",
				channelOverrides: {
					whatsapp: {
						message: "   ", // Empty after trim
					},
				},
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "whatsapp",
			status: "skipped",
			reason: "No message content provided",
		});
	});
});
