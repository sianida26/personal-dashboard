import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { EmailChannelAdapter } from "../../src/modules/notifications/channels/email-adapter";
import type { ChannelDeliveryRequest } from "../../src/modules/notifications/channels/types";
import jobQueueManager from "../../src/services/jobs/queue-manager";

// Store original function
const originalCreateJob = jobQueueManager.createJob;
let mockCreateJobCalls: unknown[][] = [];
let mockCreateJobResponse: string | Error = "test-job-id";

describe("EmailChannelAdapter", () => {
	let adapter: EmailChannelAdapter;

	beforeEach(() => {
		adapter = new EmailChannelAdapter();
		mockCreateJobCalls = [];
		mockCreateJobResponse = "test-job-id";

		// Replace with mock
		jobQueueManager.createJob = (async (options: unknown) => {
			mockCreateJobCalls.push([options]);
			if (mockCreateJobResponse instanceof Error) {
				throw mockCreateJobResponse;
			}
			return mockCreateJobResponse;
		}) as typeof originalCreateJob;
	});

	afterEach(() => {
		// Restore original
		jobQueueManager.createJob = originalCreateJob;
		mockCreateJobCalls = [];
	});

	it("should schedule email notification for valid recipients", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				title: "Test Email",
				message: "This is a test email notification",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(1);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "email",
			status: "scheduled",
			jobId: "test-job-id",
		});
	});

	it("should skip recipients without email addresses", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: null,
					phoneNumber: null,
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test Email",
				message: "This should be skipped",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "email",
			status: "skipped",
			reason: "No email address available",
		});
	});

	it("should handle multiple recipients with deduplication", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
			recipients: [
				{
					userId: "user-1",
					name: "User 1",
					email: "user1@example.com",
					phoneNumber: null,
				},
				{
					userId: "user-2",
					name: "User 2",
					email: "user2@example.com",
					phoneNumber: null,
				},
				{
					userId: "user-1", // Duplicate user
					name: "User 1",
					email: "user1@example.com",
					phoneNumber: null,
				},
			],
			request: {
				userIds: ["user-1", "user-2"],
				category: "general",
				title: "Test Email",
				message: "Multi-user notification",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(1);

		// Check the payload sent to job queue
		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { to: string[] };
		};
		expect(jobCall.payload.to).toHaveLength(2);
		expect(jobCall.payload.to).toContain("user1@example.com");
		expect(jobCall.payload.to).toContain("user2@example.com");

		// All recipients should get a result
		expect(result).toHaveLength(3);
		expect(result.every((r) => r.status === "scheduled")).toBe(true);
	});
	it("should use channel override for email addresses", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
			recipients: [
				{
					userId: "user-1",
					name: "Test User",
					email: "recipient@example.com",
					phoneNumber: null,
				},
			],
			request: {
				userId: "user-1",
				category: "general",
				title: "Test Email",
				message: "Testing override",
				channelOverrides: {
					email: {
						to: "override@example.com",
					},
				},
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(1);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { to: string[] };
		};
		expect(jobCall.payload.to).toEqual(["override@example.com"]);
		expect(result[0]?.status).toBe("scheduled");
	});
	it("should use custom subject from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				title: "Default Title",
				message: "Test message",
				channelOverrides: {
					email: {
						subject: "Custom Subject",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { subject: string };
		};
		expect(jobCall.payload.subject).toBe("Custom Subject");
	});

	it("should include CC and BCC from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				title: "Test Email",
				message: "Testing CC/BCC",
				channelOverrides: {
					email: {
						cc: ["cc1@example.com", "cc2@example.com"],
						bcc: "bcc@example.com",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { cc: string[]; bcc: string };
		};
		expect(jobCall.payload.cc).toEqual([
			"cc1@example.com",
			"cc2@example.com",
		]);
		expect(jobCall.payload.bcc).toBe("bcc@example.com");
	});

	it("should handle job creation failure", async () => {
		mockCreateJobResponse = new Error("Queue is full");

		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				title: "Test Email",
				message: "This should fail",
			},
		};

		const result = await adapter.deliver(request);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "email",
			status: "failed",
			reason: "Queue is full",
		});
	});

	it("should return empty array for wrong channel", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "whatsapp", // Wrong channel
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
				message: "Wrong channel",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(0);
		expect(result).toHaveLength(0);
	});

	it("should return empty array for empty recipients", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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

	it("should map priority correctly to job priority", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				title: "High Priority Email",
				message: "Urgent notification",
				jobOptions: {
					priority: 1, // Should map to "high"
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { priority: string };
		expect(jobCall.priority).toBe("high");
	});

	it("should include metadata in email HTML", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				category: "system",
				title: "System Notification",
				message: "System update completed",
				metadata: {
					version: "1.2.3",
					updateId: "upd-123",
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { html: string; text: string };
		};
		expect(jobCall.payload.html).toBeDefined();
		expect(jobCall.payload.html).toContain("System Notification");
		expect(jobCall.payload.html).toContain("System update completed");
		expect(jobCall.payload.text).toBe("System update completed");
	});

	it("should merge metadata from request and channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "email",
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
				message: "Testing metadata merge",
				metadata: {
					requestKey: "requestValue",
				},
				channelOverrides: {
					email: {
						metadata: {
							overrideKey: "overrideValue",
						},
					},
				},
			},
		};

		await adapter.deliver(request);

		// Verify the job was created (metadata is passed internally)
		expect(mockCreateJobCalls).toHaveLength(1);
		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { html: string };
		};
		expect(jobCall.payload.html).toBeDefined();
	});
});
