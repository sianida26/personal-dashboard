import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";
import db from "../../drizzle";
import {
	type NotificationActionInsert,
	type NotificationInsert,
	notificationActionLogs,
	notificationActions,
	notifications,
} from "../../drizzle/schema/notifications";
import { NotificationEventHub } from "../../lib/event-bus/notification-event-hub";
import type { TestUserData } from "../../utils/test-utils/create-user-for-testing";
import {
	cleanupTestUser,
	createUserForTesting,
} from "../../utils/test-utils/create-user-for-testing";
import {
	createNotificationOrchestrator,
	NotificationOrchestrator,
} from "./notification-orchestrator";
import createNotificationRepository from "./notification-repository";

describe("NotificationOrchestrator", () => {
	let testUser: TestUserData;
	let anotherUser: TestUserData;
	const createdNotificationIds: string[] = [];

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Test User - Notification Orchestrator",
			username: `test-notif-orchestrator-${Date.now()}`,
		});

		anotherUser = await createUserForTesting({
			name: "Another User - Notification Orchestrator",
			username: `another-notif-orchestrator-${Date.now()}`,
		});
	});

	afterAll(async () => {
		// Clean up created notifications
		if (createdNotificationIds.length > 0) {
			await db
				.delete(notificationActionLogs)
				.where(
					inArray(
						notificationActionLogs.notificationId,
						createdNotificationIds,
					),
				);
			await db
				.delete(notificationActions)
				.where(
					inArray(
						notificationActions.notificationId,
						createdNotificationIds,
					),
				);
			await db
				.delete(notifications)
				.where(inArray(notifications.id, createdNotificationIds));
		}

		await cleanupTestUser(testUser.user.id);
		await cleanupTestUser(anotherUser.user.id);
	});

	const createTestNotification = async (
		overrides: Partial<NotificationInsert> = {},
		actionsData: Omit<NotificationActionInsert, "notificationId">[] = [],
	) => {
		const repository = createNotificationRepository(db);
		const notificationId = createId();
		createdNotificationIds.push(notificationId);

		const notification = await repository.createNotification({
			id: notificationId,
			userId: testUser.user.id,
			type: "informational",
			category: "system",
			title: "Test Notification",
			message: "Test message",
			status: "unread",
			...overrides,
			actions: actionsData,
		});

		return notification;
	};

	describe("constructor", () => {
		test("should create with default repository and eventHub", () => {
			const orchestrator = new NotificationOrchestrator();
			expect(orchestrator).toBeDefined();
		});

		test("should create with custom repository and eventHub", () => {
			const customRepo = createNotificationRepository(db);
			const customHub = new NotificationEventHub();
			const orchestrator = new NotificationOrchestrator({
				repository: customRepo,
				eventHub: customHub,
			});
			expect(orchestrator).toBeDefined();
		});

		test("should create using factory function", () => {
			const orchestrator = createNotificationOrchestrator();
			expect(orchestrator).toBeDefined();
		});
	});

	describe("listNotifications", () => {
		beforeAll(async () => {
			// Create notifications with different dates
			const now = new Date();
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			const lastWeek = new Date(now);
			lastWeek.setDate(lastWeek.getDate() - 5);
			const twoWeeksAgo = new Date(now);
			twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

			// Today
			await createTestNotification({
				title: "Today Notification",
				createdAt: now,
			});

			// Yesterday
			await createTestNotification({
				title: "Yesterday Notification",
				createdAt: yesterday,
			});

			// This week
			await createTestNotification({
				title: "This Week Notification",
				createdAt: lastWeek,
			});

			// Earlier
			await createTestNotification({
				title: "Earlier Notification",
				createdAt: twoWeeksAgo,
			});
		});

		test("should list notifications for user with proper grouping", async () => {
			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 20,
			});

			expect(result.items.length).toBeGreaterThanOrEqual(4);
			expect(result.groups.length).toBeGreaterThan(0);

			// Check group structure
			const groupKeys = result.groups.map((g) => g.key);
			expect(groupKeys).toContain("today");

			// Verify items have normalized metadata
			for (const item of result.items) {
				expect(typeof item.metadata).toBe("object");
			}
		});

		test("should filter by status", async () => {
			// Create a read notification
			await createTestNotification({ status: "read" });

			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				status: "read",
				limit: 20,
			});

			expect(result.items.every((item) => item.status === "read")).toBe(
				true,
			);
		});

		test("should filter by type", async () => {
			await createTestNotification({ type: "approval" });

			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				type: "approval",
				limit: 20,
			});

			expect(result.items.every((item) => item.type === "approval")).toBe(
				true,
			);
		});

		test("should filter by category", async () => {
			await createTestNotification({ category: "security" });

			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				category: "security",
				limit: 20,
			});

			expect(
				result.items.every((item) => item.category === "security"),
			).toBe(true);
		});

		test("should handle cursor-based pagination", async () => {
			const orchestrator = createNotificationOrchestrator();
			const firstPage = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 2,
			});

			expect(firstPage.nextCursor).toBeDefined();
			expect(firstPage.items.length).toBeLessThanOrEqual(2);

			if (firstPage.nextCursor) {
				const secondPage = await orchestrator.listNotifications({
					userId: testUser.user.id,
					limit: 2,
					cursor: new Date(firstPage.nextCursor),
				});

				expect(secondPage.items.length).toBeGreaterThanOrEqual(0);
				// Ensure no overlap
				const firstIds = new Set(firstPage.items.map((i) => i.id));
				for (const item of secondPage.items) {
					expect(firstIds.has(item.id)).toBe(false);
				}
			}
		});

		test("should return empty nextCursor when no items", async () => {
			const orchestrator = createNotificationOrchestrator();
			// Use a user with no notifications
			const emptyUser = await createUserForTesting({
				name: "Empty User",
				username: `empty-user-${Date.now()}`,
			});

			try {
				const result = await orchestrator.listNotifications({
					userId: emptyUser.user.id,
					limit: 20,
				});

				expect(result.items.length).toBe(0);
				expect(result.nextCursor).toBeUndefined();
			} finally {
				await cleanupTestUser(emptyUser.user.id);
			}
		});

		test("should normalize metadata correctly", async () => {
			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 1,
			});

			if (result.items.length > 0) {
				const item = result.items[0];
				if (item) {
					expect(item.metadata).toBeDefined();
					expect(typeof item.metadata).toBe("object");
					expect(Array.isArray(item.metadata)).toBe(false);
				}
			}
		});

		test("should group notifications by today", async () => {
			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 20,
			});

			const todayGroup = result.groups.find((g) => g.key === "today");
			if (todayGroup) {
				expect(todayGroup.title).toBe("Today");
				expect(todayGroup.notifications.length).toBeGreaterThan(0);
			}
		});

		test("should group notifications by yesterday", async () => {
			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 20,
			});

			const yesterdayGroup = result.groups.find(
				(g) => g.key === "yesterday",
			);
			if (yesterdayGroup) {
				expect(yesterdayGroup.title).toBe("Yesterday");
			}
		});

		test("should group notifications by this week", async () => {
			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 20,
			});

			const thisWeekGroup = result.groups.find(
				(g) => g.key === "thisWeek",
			);
			if (thisWeekGroup) {
				expect(thisWeekGroup.title).toBe("This Week");
			}
		});

		test("should group notifications by earlier", async () => {
			const orchestrator = createNotificationOrchestrator();
			const result = await orchestrator.listNotifications({
				userId: testUser.user.id,
				limit: 20,
			});

			const earlierGroup = result.groups.find((g) => g.key === "earlier");
			if (earlierGroup) {
				expect(earlierGroup.title).toBe("Earlier");
			}
		});
	});

	describe("markNotifications", () => {
		test("should mark notifications as read", async () => {
			const notification = await createTestNotification({
				status: "unread",
			});

			const orchestrator = createNotificationOrchestrator();
			const updated = await orchestrator.markNotifications(
				[notification.id],
				"read",
				testUser.user.id,
			);

			expect(updated).toBe(1);

			// Verify the notification was updated
			const result = await db.query.notifications.findFirst({
				where: eq(notifications.id, notification.id),
			});
			expect(result?.status).toBe("read");
			expect(result?.readAt).toBeDefined();
		});

		test("should mark notifications as unread", async () => {
			const notification = await createTestNotification({
				status: "read",
			});

			const orchestrator = createNotificationOrchestrator();
			const updated = await orchestrator.markNotifications(
				[notification.id],
				"unread",
				testUser.user.id,
			);

			expect(updated).toBe(1);

			// Verify the notification was updated
			const result = await db.query.notifications.findFirst({
				where: eq(notifications.id, notification.id),
			});
			expect(result?.status).toBe("unread");
		});

		test("should mark multiple notifications at once", async () => {
			const notification1 = await createTestNotification({
				status: "unread",
			});
			const notification2 = await createTestNotification({
				status: "unread",
			});

			const orchestrator = createNotificationOrchestrator();
			const updated = await orchestrator.markNotifications(
				[notification1.id, notification2.id],
				"read",
				testUser.user.id,
			);

			expect(updated).toBe(2);
		});

		test("should emit read event", async () => {
			const notification = await createTestNotification({
				status: "unread",
			});

			const eventHub = new NotificationEventHub();
			let eventEmitted = false;
			let eventPayload: {
				userId: string;
				ids: string[];
				status: string;
			} = {
				userId: "",
				ids: [],
				status: "",
			};

			eventHub.on("read", (payload) => {
				eventEmitted = true;
				eventPayload = payload;
			});

			const orchestrator = new NotificationOrchestrator({
				eventHub,
			});

			await orchestrator.markNotifications(
				[notification.id],
				"read",
				testUser.user.id,
			);

			expect(eventEmitted).toBe(true);
			expect(eventPayload.userId).toBe(testUser.user.id);
			expect(eventPayload.ids).toEqual([notification.id]);
			expect(eventPayload.status).toBe("read");
		});

		test("should throw error if some notifications don't exist", async () => {
			const notification = await createTestNotification({
				status: "unread",
			});
			const nonExistentId = createId();

			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.markNotifications(
					[notification.id, nonExistentId],
					"read",
					testUser.user.id,
				),
			).rejects.toThrow(
				"Some notifications could not be updated. They may not exist or may belong to another user.",
			);
		});

		test("should throw error if notification belongs to another user", async () => {
			const notification = await createTestNotification({
				status: "unread",
			});

			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.markNotifications(
					[notification.id],
					"read",
					anotherUser.user.id, // Different user
				),
			).rejects.toThrow(
				"Some notifications could not be updated. They may not exist or may belong to another user.",
			);
		});

		test("should not emit event if no notifications were updated", async () => {
			const eventHub = new NotificationEventHub();
			let eventEmitted = false;

			eventHub.on("read", () => {
				eventEmitted = true;
			});

			const orchestrator = new NotificationOrchestrator({
				eventHub,
			});

			const nonExistentId = createId();

			try {
				await orchestrator.markNotifications(
					[nonExistentId],
					"read",
					testUser.user.id,
				);
			} catch {
				// Expected to throw
			}

			expect(eventEmitted).toBe(false);
		});

		test("should handle duplicate IDs in the list", async () => {
			const notification = await createTestNotification({
				status: "unread",
			});

			const orchestrator = createNotificationOrchestrator();

			// Pass the same ID twice
			const updated = await orchestrator.markNotifications(
				[notification.id, notification.id],
				"read",
				testUser.user.id,
			);

			// Should still only update once
			expect(updated).toBe(1);
		});
	});

	describe("executeAction", () => {
		test("should execute action on approval notification", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "approve",
						label: "Approve",
						requiresComment: false,
					},
				],
			);

			const orchestrator = createNotificationOrchestrator();
			const log = await orchestrator.executeAction({
				notificationId: notification.id,
				actionKey: "approve",
				comment: undefined,
				actedBy: testUser.user.id,
			});

			expect(log).toBeDefined();
			expect(log.notificationId).toBe(notification.id);
			expect(log.actionKey).toBe("approve");
			expect(log.actedBy).toBe(testUser.user.id);

			// Verify notification was marked as read
			const updatedNotification = await db.query.notifications.findFirst({
				where: eq(notifications.id, notification.id),
			});
			expect(updatedNotification?.status).toBe("read");
		});

		test("should execute action with comment", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "reject",
						label: "Reject",
						requiresComment: true,
					},
				],
			);

			const orchestrator = createNotificationOrchestrator();
			const log = await orchestrator.executeAction({
				notificationId: notification.id,
				actionKey: "reject",
				comment: "This needs more work",
				actedBy: testUser.user.id,
			});

			expect(log.comment).toBe("This needs more work");
		});

		test("should throw error if notification not found", async () => {
			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.executeAction({
					notificationId: createId(),
					actionKey: "approve",
					comment: undefined,
					actedBy: testUser.user.id,
				}),
			).rejects.toThrow("Notification not found");
		});

		test("should throw error if user doesn't own notification", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "approve",
						label: "Approve",
						requiresComment: false,
					},
				],
			);

			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.executeAction({
					notificationId: notification.id,
					actionKey: "approve",
					comment: undefined,
					actedBy: anotherUser.user.id,
				}),
			).rejects.toThrow(
				"You can only act on notifications assigned to you.",
			);
		});

		test("should throw error if notification is not approval type", async () => {
			const notification = await createTestNotification({
				type: "informational",
				status: "unread",
			});

			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.executeAction({
					notificationId: notification.id,
					actionKey: "approve",
					comment: undefined,
					actedBy: testUser.user.id,
				}),
			).rejects.toThrow(
				"Actions can only be executed for approval notifications",
			);
		});

		test("should throw error if action not registered", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "approve",
						label: "Approve",
						requiresComment: false,
					},
				],
			);

			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.executeAction({
					notificationId: notification.id,
					actionKey: "unknown-action",
					comment: undefined,
					actedBy: testUser.user.id,
				}),
			).rejects.toThrow("Action not registered for notification");
		});

		test("should throw error if comment required but not provided", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "reject",
						label: "Reject",
						requiresComment: true,
					},
				],
			);

			const orchestrator = createNotificationOrchestrator();

			await expect(
				orchestrator.executeAction({
					notificationId: notification.id,
					actionKey: "reject",
					comment: undefined,
					actedBy: testUser.user.id,
				}),
			).rejects.toThrow("Comment is required for this action");
		});

		test("should emit actioned event", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "approve",
						label: "Approve",
						requiresComment: false,
					},
				],
			);

			const eventHub = new NotificationEventHub();
			let eventEmitted = false;
			let eventPayload: {
				notificationId: string;
				actionKey: string;
				actedBy: string;
			} = { notificationId: "", actionKey: "", actedBy: "" };

			eventHub.on("actioned", (payload) => {
				eventEmitted = true;
				eventPayload = {
					notificationId: payload.notificationId,
					actionKey: payload.actionKey,
					actedBy: payload.actedBy,
				};
			});

			const orchestrator = new NotificationOrchestrator({
				eventHub,
			});

			await orchestrator.executeAction({
				notificationId: notification.id,
				actionKey: "approve",
				comment: undefined,
				actedBy: testUser.user.id,
			});

			expect(eventEmitted).toBe(true);
			expect(eventPayload.notificationId).toBe(notification.id);
			expect(eventPayload.actionKey).toBe("approve");
		});

		test("should allow comment when not required", async () => {
			const notification = await createTestNotification(
				{
					type: "approval",
					status: "unread",
				},
				[
					{
						actionKey: "approve",
						label: "Approve",
						requiresComment: false,
					},
				],
			);

			const orchestrator = createNotificationOrchestrator();
			const log = await orchestrator.executeAction({
				notificationId: notification.id,
				actionKey: "approve",
				comment: "Optional comment",
				actedBy: testUser.user.id,
			});

			expect(log.comment).toBe("Optional comment");
		});
	});

	describe("getUnreadCount", () => {
		test("should return unread count for user", async () => {
			// Create some unread notifications
			await createTestNotification({ status: "unread" });
			await createTestNotification({ status: "unread" });
			await createTestNotification({ status: "read" });

			const orchestrator = createNotificationOrchestrator();
			const count = await orchestrator.getUnreadCount(testUser.user.id);

			expect(count).toBeGreaterThanOrEqual(2);
		});

		test("should return 0 for user with no unread notifications", async () => {
			const emptyUser = await createUserForTesting({
				name: "Empty User Count",
				username: `empty-user-count-${Date.now()}`,
			});

			try {
				const orchestrator = createNotificationOrchestrator();
				const count = await orchestrator.getUnreadCount(
					emptyUser.user.id,
				);

				expect(count).toBe(0);
			} finally {
				await cleanupTestUser(emptyUser.user.id);
			}
		});

		test("should not count read notifications", async () => {
			const user = await createUserForTesting({
				name: "Read Count User",
				username: `read-count-user-${Date.now()}`,
			});

			try {
				const repository = createNotificationRepository(db);
				const notificationId = createId();
				createdNotificationIds.push(notificationId);

				await repository.createNotification({
					id: notificationId,
					userId: user.user.id,
					type: "informational",
					category: "system",
					title: "Read Notification",
					message: "This is read",
					status: "read",
				});

				const orchestrator = createNotificationOrchestrator();
				const count = await orchestrator.getUnreadCount(user.user.id);

				expect(count).toBe(0);
			} finally {
				await cleanupTestUser(user.user.id);
			}
		});
	});
});
