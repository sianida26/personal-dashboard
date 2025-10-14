import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
} from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../src/drizzle";
import {
	notificationActionLogs,
	notificationActions,
	notifications,
} from "../../src/drizzle/schema/notifications";
import { users } from "../../src/drizzle/schema/users";
import createNotificationRepository from "../../src/modules/notifications/notification-repository";
import {
	NotificationEventHub,
} from "../../src/lib/event-bus/notification-event-hub";
import NotificationOrchestrator from "../../src/modules/notifications/notification-orchestrator";

describe("NotificationOrchestrator", () => {
	let userId: string;
	const repository = createNotificationRepository();

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

	it("emits created events when creating notifications", async () => {
		const hub = new NotificationEventHub();
		const orchestrator = new NotificationOrchestrator({
			repository,
			eventHub: hub,
		});

		let emittedId: string | null = null;
		hub.on("created", (payload) => {
			emittedId = payload.id;
		});

		const created = await orchestrator.createNotification({
			userId,
			type: "informational",
			title: "Welcome",
			message: "Hello world",
			metadata: {},
		});

		expect(created.title).toBe("Welcome");
		expect(emittedId).toBe(created.id);
	});

	it("groups notifications by date bucket", async () => {
		const orchestrator = new NotificationOrchestrator({
			repository,
			eventHub: new NotificationEventHub(),
		});

		// Today
		await orchestrator.createNotification({
			userId,
			type: "informational",
			title: "Today item",
			message: "Today",
			metadata: {},
		});

		// Yesterday
		await repository.createNotification({
			userId,
			type: "informational",
			title: "Yesterday item",
			message: "Yesterday",
			metadata: {},
			createdAt: new Date(Date.now() - 86_400_000),
		});

		const { groups } = await orchestrator.listNotifications({
			userId,
			limit: 20,
		});

		const groupKeys = groups.map((group) => group.key);
		expect(groupKeys).toContain("today");
		expect(groupKeys).toContain("yesterday");
	});

	it("emits read events when marking notifications", async () => {
		const hub = new NotificationEventHub();
		const orchestrator = new NotificationOrchestrator({
			repository,
			eventHub: hub,
		});

		const created = await orchestrator.createNotification({
			userId,
			type: "informational",
			title: "Toggle",
			message: "Toggle read",
			metadata: {},
		});

		let payload: { ids: string[]; status: "read" | "unread" } | null = null;
		hub.on("read", (event) => {
			payload = event;
		});

		const updated = await orchestrator.markNotifications(
			[created.id],
			"read",
			userId,
		);

		expect(updated).toBe(1);
		expect(payload?.ids).toContain(created.id);
		expect(payload?.status).toBe("read");
	});

	it("prevents executing undefined actions and records logs", async () => {
		const hub = new NotificationEventHub();
		const orchestrator = new NotificationOrchestrator({
			repository,
			eventHub: hub,
		});

		const created = await repository.createNotification({
			userId,
			type: "approval",
			title: "Needs review",
			message: "Approve with comment",
			metadata: {},
			actions: [
				{
					actionKey: "approve",
					label: "Approve",
					requiresComment: true,
				},
			],
		});

		await expect(
			orchestrator.executeAction({
				notificationId: created.id,
				actionKey: "approve",
				actedBy: userId,
			}),
		).rejects.toThrow("Comment is required for this action");

		let emittedLogId: string | null = null;
		hub.on("actioned", (log) => {
			emittedLogId = log.id;
		});

		const log = await orchestrator.executeAction({
			notificationId: created.id,
			actionKey: "approve",
			comment: "Looks good",
			actedBy: userId,
		});

		expect(log.notificationId).toBe(created.id);
		expect(emittedLogId).toBe(log.id);

		const stored = await db.query.notificationActionLogs.findMany({
			where: eq(notificationActionLogs.notificationId, created.id),
		});

		expect(stored).toHaveLength(1);
	});

	it("returns unread counts per user", async () => {
		const orchestrator = new NotificationOrchestrator({
			repository,
			eventHub: new NotificationEventHub(),
		});

		await orchestrator.createNotification({
			userId,
			type: "informational",
			title: "Unread count",
			message: "Count me in",
			metadata: {},
		});

		const count = await orchestrator.getUnreadCount(userId);
		expect(count).toBeGreaterThanOrEqual(1);
	});
});
