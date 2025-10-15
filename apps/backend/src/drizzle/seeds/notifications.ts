import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import db from "../index";
import {
	notifications,
	notificationActions,
	notificationActionLogs,
} from "../schema/notifications";
import { users } from "../schema/users";

const notificationsSeeder = async () => {
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(notifications);

	if (Number(count) > 0) {
		return;
	}

	const [recipient] = await db
		.select({
			id: users.id,
			username: users.username,
		})
		.from(users)
		.where(eq(users.username, "superadmin"))
		.limit(1);

	if (!recipient) {
		return;
	}

	const now = new Date();

	const sampleNotifications: (typeof notifications.$inferInsert & {
		actions?: typeof notificationActions.$inferInsert[];
		logs?: typeof notificationActionLogs.$inferInsert[];
	})[] = [
		{
			id: createId(),
			userId: recipient.id,
			type: "informational",
			title: "Welcome to the notification center",
			message:
				"You now have a dedicated notification hub. Future workflow updates will appear here.",
			metadata: {
				linkLabel: "View dashboard",
				linkHref: "/dashboard",
			},
			status: "unread",
			category: "system",
			createdAt: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
			readAt: null,
			expiresAt: null,
		},
		{
			id: createId(),
			userId: recipient.id,
			type: "approval",
			title: "Purchase order PO-1024 needs your review",
			message:
				"A new purchase order has been submitted and is waiting on your approval.",
			metadata: {
				resourceType: "purchaseOrder",
				resourceId: "PO-1024",
			},
			status: "unread",
			category: "approvals",
			createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6), // 6 hours ago
			readAt: null,
			expiresAt: null,
			actions: [
				{
					id: createId(),
					actionKey: "approve",
					label: "Approve",
					requiresComment: false,
				},
				{
					id: createId(),
					actionKey: "request_changes",
					label: "Request Changes",
					requiresComment: true,
				},
			],
			logs: [],
		},
		{
			id: createId(),
			userId: recipient.id,
			type: "informational",
			title: "Weekly security scan complete",
			message:
				"The automated vulnerability scan completed without new findings.",
			metadata: {
				priority: "low",
			},
			status: "read",
			category: "reports",
			createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
			readAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
			expiresAt: null,
		},
	];

	for (const notification of sampleNotifications) {
		const { actions, logs, ...record } = notification;

		await db.insert(notifications).values(record).onConflictDoNothing();

		if (actions?.length) {
			await db
				.insert(notificationActions)
				.values(
					actions.map((action) => ({
						...action,
						notificationId: notification.id,
					})),
				)
				.onConflictDoNothing();
		}

		if (logs?.length) {
			await db
				.insert(notificationActionLogs)
				.values(
					logs.map((log) => ({
						...log,
						notificationId: notification.id,
					})),
				)
				.onConflictDoNothing();
		}
	}
};

export default notificationsSeeder;
