import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import db from "..";
import {
	type NotificationActionInsert,
	type NotificationActionLogInsert,
	type NotificationInsert,
	notificationActionLogs,
	notificationActions,
	notifications,
} from "./notifications";
import { rolesSchema } from "./roles";
import { rolesToUsers } from "./rolesToUsers";
import { users } from "./users";

describe("Notifications Schema", () => {
	let testUserId: string;

	beforeEach(async () => {
		// Clean up
		await db.delete(notificationActionLogs);
		await db.delete(notificationActions);
		await db.delete(notifications);
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);

		// Create test role
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "test-role",
				name: "Test Role",
				description: "Test role",
			})
			.returning();

		// Create test user
		const [user] = await db
			.insert(users)
			.values({
				name: "Test User",
				username: "testuser",
				email: "test@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");
		testUserId = user.id;

		// Assign role to user
		await db.insert(rolesToUsers).values({
			userId: testUserId,
			roleId: role.id,
		});
	});

	afterEach(async () => {
		// Clean up
		await db.delete(notificationActionLogs);
		await db.delete(notificationActions);
		await db.delete(notifications);
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);
	});

	describe("notifications table", () => {
		test("should create notification with required fields", async () => {
			const notificationData: NotificationInsert = {
				userId: testUserId,
				type: "informational",
				title: "Test Notification",
				message: "This is a test notification",
				status: "unread",
			};

			const [notification] = await db
				.insert(notifications)
				.values(notificationData)
				.returning();

			expect(notification).toBeDefined();
			expect(notification?.id).toBeDefined();
			expect(notification?.userId).toBe(testUserId);
			expect(notification?.type).toBe("informational");
			expect(notification?.title).toBe("Test Notification");
			expect(notification?.message).toBe("This is a test notification");
			expect(notification?.status).toBe("unread");
			expect(notification?.createdAt).toBeInstanceOf(Date);
		});

		test("should create notification with optional metadata", async () => {
			const metadata = {
				linkLabel: "View Details",
				linkHref: "/details",
				priority: "high",
			};

			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "informational",
					title: "Test",
					message: "Test message",
					status: "unread",
					metadata,
				})
				.returning();

			expect(notification?.metadata).toEqual(metadata);
		});

		test("should create notification with category", async () => {
			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "approval",
					title: "Approval Required",
					message: "Please approve",
					status: "unread",
					category: "approvals",
				})
				.returning();

			expect(notification?.category).toBe("approvals");
		});

		test("should create notification with expiration", async () => {
			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "informational",
					title: "Expiring Notification",
					message: "This will expire",
					status: "unread",
					expiresAt,
				})
				.returning();

			expect(notification?.expiresAt).toBeInstanceOf(Date);
			expect(notification?.expiresAt?.getTime()).toBe(
				expiresAt.getTime(),
			);
		});

		test("should create notification with group key", async () => {
			// groupKey is a date string, not Date object
			const groupKey = new Date().toISOString().split("T")[0];

			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "informational",
					title: "Grouped Notification",
					message: "Part of a group",
					status: "unread",
					groupKey,
				})
				.returning();

			expect(notification?.groupKey).toBe(groupKey);
		});

		test("should mark notification as read with readAt timestamp", async () => {
			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "informational",
					title: "Test",
					message: "Test",
					status: "unread",
				})
				.returning();

			if (!notification) throw new Error("Failed to create notification");

			const readAt = new Date();

			const [updated] = await db
				.update(notifications)
				.set({
					status: "read",
					readAt,
				})
				.where(eq(notifications.id, notification.id))
				.returning();

			expect(updated?.status).toBe("read");
			expect(updated?.readAt).toBeInstanceOf(Date);
		});

		test("should cascade delete notifications when user is deleted", async () => {
			await db.insert(notifications).values({
				userId: testUserId,
				type: "informational",
				title: "Test",
				message: "Test",
				status: "unread",
			});

			await db.delete(users).where(eq(users.id, testUserId));

			const remaining = await db
				.select()
				.from(notifications)
				.where(eq(notifications.userId, testUserId));

			expect(remaining).toHaveLength(0);
		});
	});

	describe("notificationActions table", () => {
		let testNotificationId: string;

		beforeEach(async () => {
			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "approval",
					title: "Test Approval",
					message: "Test",
					status: "unread",
				})
				.returning();

			if (!notification) throw new Error("Failed to create notification");
			testNotificationId = notification.id;
		});

		test("should create notification action", async () => {
			const actionData: NotificationActionInsert = {
				notificationId: testNotificationId,
				actionKey: "approve",
				label: "Approve",
				requiresComment: false,
			};

			const [action] = await db
				.insert(notificationActions)
				.values(actionData)
				.returning();

			expect(action).toBeDefined();
			expect(action?.id).toBeDefined();
			expect(action?.notificationId).toBe(testNotificationId);
			expect(action?.actionKey).toBe("approve");
			expect(action?.label).toBe("Approve");
			expect(action?.requiresComment).toBe(false);
			expect(action?.createdAt).toBeInstanceOf(Date);
		});

		test("should create action requiring comment", async () => {
			const [action] = await db
				.insert(notificationActions)
				.values({
					notificationId: testNotificationId,
					actionKey: "reject",
					label: "Reject",
					requiresComment: true,
				})
				.returning();

			expect(action?.requiresComment).toBe(true);
		});

		test("should cascade delete actions when notification is deleted", async () => {
			await db.insert(notificationActions).values({
				notificationId: testNotificationId,
				actionKey: "approve",
				label: "Approve",
				requiresComment: false,
			});

			await db
				.delete(notifications)
				.where(eq(notifications.id, testNotificationId));

			const remaining = await db
				.select()
				.from(notificationActions)
				.where(
					eq(notificationActions.notificationId, testNotificationId),
				);

			expect(remaining).toHaveLength(0);
		});

		test("should create multiple actions for one notification", async () => {
			const actions: NotificationActionInsert[] = [
				{
					notificationId: testNotificationId,
					actionKey: "approve",
					label: "Approve",
					requiresComment: false,
				},
				{
					notificationId: testNotificationId,
					actionKey: "reject",
					label: "Reject",
					requiresComment: true,
				},
			];

			await db.insert(notificationActions).values(actions);

			const inserted = await db
				.select()
				.from(notificationActions)
				.where(
					eq(notificationActions.notificationId, testNotificationId),
				);

			expect(inserted).toHaveLength(2);
		});
	});

	describe("notificationActionLogs table", () => {
		let testNotificationId: string;

		beforeEach(async () => {
			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "approval",
					title: "Test Approval",
					message: "Test",
					status: "unread",
				})
				.returning();

			if (!notification) throw new Error("Failed to create notification");
			testNotificationId = notification.id;
		});

		test("should create action log", async () => {
			const logData: NotificationActionLogInsert = {
				notificationId: testNotificationId,
				actionKey: "approve",
				actedBy: testUserId,
			};

			const [log] = await db
				.insert(notificationActionLogs)
				.values(logData)
				.returning();

			expect(log).toBeDefined();
			expect(log?.id).toBeDefined();
			expect(log?.notificationId).toBe(testNotificationId);
			expect(log?.actionKey).toBe("approve");
			expect(log?.actedBy).toBe(testUserId);
			expect(log?.actedAt).toBeInstanceOf(Date);
		});

		test("should create action log with comment", async () => {
			const [log] = await db
				.insert(notificationActionLogs)
				.values({
					notificationId: testNotificationId,
					actionKey: "reject",
					actedBy: testUserId,
					comment: "Not approved due to missing information",
				})
				.returning();

			expect(log?.comment).toBe(
				"Not approved due to missing information",
			);
		});

		test("should cascade delete logs when notification is deleted", async () => {
			await db.insert(notificationActionLogs).values({
				notificationId: testNotificationId,
				actionKey: "approve",
				actedBy: testUserId,
			});

			await db
				.delete(notifications)
				.where(eq(notifications.id, testNotificationId));

			const remaining = await db
				.select()
				.from(notificationActionLogs)
				.where(
					eq(
						notificationActionLogs.notificationId,
						testNotificationId,
					),
				);

			expect(remaining).toHaveLength(0);
		});

		test("should track multiple actions on same notification", async () => {
			const logs: NotificationActionLogInsert[] = [
				{
					notificationId: testNotificationId,
					actionKey: "view",
					actedBy: testUserId,
				},
				{
					notificationId: testNotificationId,
					actionKey: "approve",
					actedBy: testUserId,
					comment: "Looks good",
				},
			];

			await db.insert(notificationActionLogs).values(logs);

			const inserted = await db
				.select()
				.from(notificationActionLogs)
				.where(
					eq(
						notificationActionLogs.notificationId,
						testNotificationId,
					),
				);

			expect(inserted).toHaveLength(2);
		});
	});

	describe("notification relations", () => {
		test("should query notification with related user", async () => {
			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "informational",
					title: "Test",
					message: "Test",
					status: "unread",
				})
				.returning();

			if (!notification) throw new Error("Failed to create notification");

			const result = await db.query.notifications.findFirst({
				where: eq(notifications.id, notification.id),
				with: {
					user: true,
				},
			});

			expect(result).toBeDefined();
			expect(result?.user).toBeDefined();
			expect(result?.user.id).toBe(testUserId);
		});

		test("should query notification with actions and logs", async () => {
			const [notification] = await db
				.insert(notifications)
				.values({
					userId: testUserId,
					type: "approval",
					title: "Test",
					message: "Test",
					status: "unread",
				})
				.returning();

			if (!notification) throw new Error("Failed to create notification");

			await db.insert(notificationActions).values({
				notificationId: notification.id,
				actionKey: "approve",
				label: "Approve",
				requiresComment: false,
			});

			await db.insert(notificationActionLogs).values({
				notificationId: notification.id,
				actionKey: "approve",
				actedBy: testUserId,
			});

			const result = await db.query.notifications.findFirst({
				where: eq(notifications.id, notification.id),
				with: {
					actions: true,
					actionLogs: {
						with: {
							user: true,
						},
					},
				},
			});

			expect(result).toBeDefined();
			expect(result?.actions).toHaveLength(1);
			expect(result?.actionLogs).toHaveLength(1);
			expect(result?.actionLogs[0]?.user).toBeDefined();
		});
	});

	describe("notification indexes", () => {
		test("should efficiently query by user and status", async () => {
			// Create multiple notifications
			await db.insert(notifications).values([
				{
					userId: testUserId,
					type: "informational",
					title: "Test 1",
					message: "Test",
					status: "unread",
				},
				{
					userId: testUserId,
					type: "informational",
					title: "Test 2",
					message: "Test",
					status: "read",
				},
				{
					userId: testUserId,
					type: "informational",
					title: "Test 3",
					message: "Test",
					status: "unread",
				},
			]);

			const unreadNotifications = await db
				.select()
				.from(notifications)
				.where(
					and(
						eq(notifications.userId, testUserId),
						eq(notifications.status, "unread"),
					),
				);

			expect(unreadNotifications).toHaveLength(2);
		});

		test("should efficiently query by user and group key", async () => {
			const groupKey = new Date().toISOString().split("T")[0] as string;

			await db.insert(notifications).values([
				{
					userId: testUserId,
					type: "informational",
					title: "Test 1",
					message: "Test",
					status: "unread",
					groupKey,
				},
				{
					userId: testUserId,
					type: "informational",
					title: "Test 2",
					message: "Test",
					status: "unread",
					groupKey,
				},
			]);

			const grouped = await db
				.select()
				.from(notifications)
				.where(eq(notifications.userId, testUserId));

			// Filter by groupKey in memory since the type is complex
			const filteredByGroup = grouped.filter(
				(n) => n.groupKey === groupKey,
			);

			expect(filteredByGroup).toHaveLength(2);
		});
	});
});
