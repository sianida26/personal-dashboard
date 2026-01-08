import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { InAppChannelAdapter } from "../../src/services/notifications/channels/in-app-adapter";
import type { ChannelDeliveryRequest } from "../../src/services/notifications/channels/types";
import jobQueueManager from "../../src/services/jobs/queue-manager";

// Store original function
const originalCreateJob = jobQueueManager.createJob;
let mockCreateJobCalls: unknown[][] = [];
let mockCreateJobResponse: string | Error = "test-job-id";

describe("InAppChannelAdapter", () => {
	let adapter: InAppChannelAdapter;

	beforeEach(() => {
		adapter = new InAppChannelAdapter();
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

	it("should schedule in-app notification for valid recipients", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				title: "Test Notification",
				message: "This is a test in-app notification",
			},
		};

		const result = await adapter.deliver(request);

		expect(mockCreateJobCalls).toHaveLength(1);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "inApp",
			status: "scheduled",
			jobId: "test-job-id",
		});
	});

	it("should create separate job for each unique recipient", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
			],
			request: {
				userIds: ["user-1", "user-2"],
				category: "general",
				title: "Test Notification",
				message: "Multi-user notification",
			},
		};

		const result = await adapter.deliver(request);

		// Should create 2 jobs (one per recipient)
		expect(mockCreateJobCalls).toHaveLength(2);
		expect(result).toHaveLength(2);
		expect(result[0]?.status).toBe("scheduled");
		expect(result[1]?.status).toBe("scheduled");
	});

	it("should deduplicate recipients by userId", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
			recipients: [
				{
					userId: "user-1",
					name: "User 1",
					email: "user1@example.com",
					phoneNumber: null,
				},
				{
					userId: "user-1", // Duplicate
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
			],
			request: {
				userIds: ["user-1", "user-2"],
				category: "general",
				title: "Test",
				message: "Deduplication test",
			},
		};

		const result = await adapter.deliver(request);

		// Should only create 2 jobs (deduplicated)
		expect(mockCreateJobCalls).toHaveLength(2);
		expect(result).toHaveLength(2); // Returns result for unique recipients only
	});

	it("should use notification type from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Testing type override",
				notificationType: "informational",
				channelOverrides: {
					inApp: {
						type: "approval",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { type: string } };
		};
		expect(jobCall.payload.notification.type).toBe("approval");
	});

	it("should use title and message from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Default message",
				channelOverrides: {
					inApp: {
						title: "Override Title",
						message: "Override message",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { title: string; message: string } };
		};
		expect(jobCall.payload.notification.title).toBe("Override Title");
		expect(jobCall.payload.notification.message).toBe("Override message");
	});

	it("should include metadata from request and override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				title: "Test",
				message: "Testing metadata",
				metadata: {
					requestKey: "requestValue",
				},
				channelOverrides: {
					inApp: {
						metadata: {
							overrideKey: "overrideValue",
						},
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { metadata: Record<string, unknown> } };
		};
		expect(jobCall.payload.notification.metadata).toMatchObject({
			requestKey: "requestValue",
			overrideKey: "overrideValue",
		});
	});

	it("should include eventType in metadata if provided", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Event test",
				eventType: "user.created",
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { metadata: Record<string, unknown> } };
		};
		expect(jobCall.payload.notification.metadata.eventType).toBe(
			"user.created",
		);
	});

	it("should use custom notification ID from override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Custom ID test",
				channelOverrides: {
					inApp: {
						id: "custom-notification-id",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { id: string } };
		};
		expect(jobCall.payload.notification.id).toBe(
			"custom-notification-id_user-1",
		);
	});

	it("should set status from override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Status test",
				channelOverrides: {
					inApp: {
						status: "read",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { status: string } };
		};
		expect(jobCall.payload.notification.status).toBe("read");
	});

	it("should include category from override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Category test",
				channelOverrides: {
					inApp: {
						category: "alert",
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { category: string } };
		};
		expect(jobCall.payload.notification.category).toBe("alert");
	});

	it("should include actions from override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Actions test",
				channelOverrides: {
					inApp: {
						actions: [
							{
								actionKey: "approve",
								label: "Approve",
								requiresComment: false,
							},
							{
								actionKey: "reject",
								label: "Reject",
								requiresComment: true,
							},
						],
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { actions: unknown[] } };
		};
		expect(jobCall.payload.notification.actions).toHaveLength(2);
	});

	it("should include expiresAt from override", async () => {
		const expiryDate = new Date("2025-12-31T23:59:59Z");
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Expiry test",
				channelOverrides: {
					inApp: {
						expiresAt: expiryDate,
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { expiresAt: Date } };
		};
		expect(jobCall.payload.notification.expiresAt).toBe(expiryDate);
	});

	it("should map priority to job priority correctly", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				title: "High Priority",
				message: "Urgent notification",
				jobOptions: {
					priority: 0, // Should map to "critical"
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { priority: string };
		expect(jobCall.priority).toBe("critical");
	});

	it("should default priority to normal when not specified", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
			channel: "inApp",
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
				message: "This should fail",
			},
		};

		const result = await adapter.deliver(request);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			channel: "inApp",
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
			channel: "inApp",
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

	it("should include priority in metadata when set in request", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Priority in metadata",
				metadata: {
					priority: 1,
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { metadata: Record<string, unknown> } };
		};
		expect(jobCall.payload.notification.metadata.priority).toBe(1);
	});

	it("should override priority in metadata from channel override", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Priority override",
				metadata: {
					priority: 1,
				},
				channelOverrides: {
					inApp: {
						metadata: {
							priority: 0,
						},
					},
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as {
			payload: { notification: { metadata: Record<string, unknown> } };
		};
		expect(jobCall.payload.notification.metadata.priority).toBe(0);
	});

	it("should set correct job type", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Job type test",
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { type: string };
		expect(jobCall.type).toBe("in-app-notification");
	});

	it("should respect maxRetries from jobOptions", async () => {
		const request: ChannelDeliveryRequest = {
			channel: "inApp",
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
				message: "Max retries test",
				jobOptions: {
					maxRetries: 5,
				},
			},
		};

		await adapter.deliver(request);

		const jobCall = mockCreateJobCalls[0]?.[0] as { maxRetries: number };
		expect(jobCall.maxRetries).toBe(5);
	});
});
