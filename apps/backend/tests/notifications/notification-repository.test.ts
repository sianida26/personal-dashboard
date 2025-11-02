import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../src/drizzle";
import {
	notificationActions,
	notificationActionLogs,
	notifications,
} from "../../src/drizzle/schema/notifications";
import { users } from "../../src/drizzle/schema/users";
import createNotificationRepository from "../../src/modules/notifications/notification-repository";

const repository = createNotificationRepository();

describe("NotificationRepository", () => {
	let userId: string;

	beforeAll(async () => {
		const user = await db.query.users.findFirst({
			where: eq(users.username, "superadmin"),
		});

		if (!user) {
			throw new Error("Expected seeded superadmin user for tests");
		}

		userId = user.id;
	});

	afterEach(async () => {
		await db.delete(notificationActionLogs);
		await db.delete(notificationActions);
		await db.delete(notifications);
	});

	it("creates notifications with actions", async () => {
		const record = await repository.createNotification({
			userId,
			type: "approval",
			title: "Pending approval",
			message: "Review required",
			metadata: { foo: "bar" },
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
		});

		expect(record.id).toBeDefined();
		expect(record.actions).toHaveLength(2);
		expect(record.actionLogs).toHaveLength(0);

		const stored = await db.query.notifications.findFirst({
			where: eq(notifications.id, record.id),
			with: {
				actions: true,
			},
		});

		expect(stored?.actions).toHaveLength(2);
	});

	it("lists notifications with applied filters", async () => {
		await Promise.all([
			repository.createNotification({
				userId,
				type: "informational",
				title: "Info",
				message: "Informational notice",
				metadata: {},
				category: "leads",
			}),
			repository.createNotification({
				userId,
				type: "approval",
				title: "Approval needed",
				message: "Approval notice",
				metadata: {},
				category: "orders",
			}),
		]);

		const approvals = await repository.listNotificationsForUser({
			userId,
			type: "approval",
			limit: 10,
		});

		expect(approvals).toHaveLength(1);
		expect(approvals[0]?.type).toBe("approval");
	});

	it("filters notifications by category", async () => {
		await Promise.all([
			repository.createNotification({
				userId,
				type: "informational",
				title: "Order update",
				message: "License uploaded",
				metadata: {},
				category: "orders",
			}),
			repository.createNotification({
				userId,
				type: "informational",
				title: "Leads update",
				message: "Lead closed",
				metadata: {},
				category: "leads",
			}),
		]);

		const orders = await repository.listNotificationsForUser({
			userId,
			category: "orders",
			limit: 10,
		});

		expect(orders).toHaveLength(1);
		expect(orders[0]?.category).toBe("orders");
	});

	it("marks notifications as read and clears readAt when unread", async () => {
		const record = await repository.createNotification({
			userId,
			type: "informational",
			title: "Info",
			message: "toggle",
			metadata: {},
		});

		const updatedToRead = await repository.markNotifications(
			[record.id],
			"read",
		);

		expect(updatedToRead).toBe(1);

		const afterRead = await db.query.notifications.findFirst({
			where: eq(notifications.id, record.id),
		});

		expect(afterRead?.status).toBe("read");
		expect(afterRead?.readAt).toBeInstanceOf(Date);

		const updatedToUnread = await repository.markNotifications(
			[record.id],
			"unread",
		);

		expect(updatedToUnread).toBe(1);

		const afterUnread = await db.query.notifications.findFirst({
			where: eq(notifications.id, record.id),
		});

		expect(afterUnread?.status).toBe("unread");
		expect(afterUnread?.readAt).toBeNull();
	});

	it("records action logs and cascades on parent deletion", async () => {
		const notification = await repository.createNotification({
			userId,
			type: "approval",
			title: "Approval needed",
			message: "Action log test",
			metadata: {},
			actions: [
				{
					actionKey: "approve",
					label: "Approve",
					requiresComment: false,
				},
			],
		});

		const log = await repository.recordActionLog({
			notificationId: notification.id,
			actionKey: "approve",
			actedBy: userId,
			comment: "looks good",
		});

		expect(log.id).toBeDefined();
		expect(log.notificationId).toBe(notification.id);

		await db
			.delete(notifications)
			.where(eq(notifications.id, notification.id));

		const orphanActions = await db
			.select()
			.from(notificationActions)
			.where(eq(notificationActions.notificationId, notification.id));

		const orphanLogs = await db
			.select()
			.from(notificationActionLogs)
			.where(eq(notificationActionLogs.notificationId, notification.id));

		expect(orphanActions).toHaveLength(0);
		expect(orphanLogs).toHaveLength(0);
	});

	it("counts unread notifications for user", async () => {
		await Promise.all([
			repository.createNotification({
				userId,
				type: "informational",
				title: "Unread 1",
				message: "Still unread",
				metadata: {},
			}),
			repository.createNotification({
				userId,
				type: "informational",
				title: "Unread 2",
				message: "Still unread",
				metadata: {},
			}),
		]);

		const initialCount = await repository.countUnread(userId);
		expect(initialCount).toBe(2);

		await repository.markNotifications(
			[
				(
					await db
						.select({ id: notifications.id })
						.from(notifications)
						.limit(1)
				)[0]?.id ?? "",
			].filter(Boolean),
			"read",
		);

		const afterMark = await repository.countUnread(userId);
		expect(afterMark).toBe(1);
	});
});
