import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
} from "bun:test";
import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import db from "../../src/drizzle";
import { appRoutes } from "../../src/index";
import { notifications } from "../../src/drizzle/schema/notifications";
import { users } from "../../src/drizzle/schema/users";
import NotificationOrchestrator from "../../src/modules/notifications/notification-orchestrator";
import { generateAccessToken } from "../../src/utils/authUtils";

describe("Notifications API", () => {
	const client = testClient(appRoutes);
	const orchestrator = new NotificationOrchestrator();
	let userId: string;
	let bearerToken: string;

	beforeAll(async () => {
		const user = await db.query.users.findFirst({
			where: eq(users.username, "superadmin"),
		});

		if (!user) {
			throw new Error("Super admin user not found for notifications tests");
		}

		userId = user.id;
		bearerToken = await generateAccessToken({ uid: userId });
	});

	afterEach(async () => {
		await db.delete(notifications);
	});

	const authHeaders = () => ({
		Authorization: `Bearer ${bearerToken}`,
		"Content-Type": "application/json",
	});

	it("lists notifications for authenticated user", async () => {
		await orchestrator.createNotification({
			userId,
			type: "informational",
			title: "API visible",
			message: "Hello from API test",
			metadata: {},
		});

		const response = await client.notifications.$get(
			{
				query: {},
			},
			{
				headers: authHeaders(),
			},
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(Array.isArray(payload.items)).toBe(true);
	});

	it("bulk marks notifications as read", async () => {
		const created = await orchestrator.createNotification({
			userId,
			type: "informational",
			title: "Mark read",
			message: "Mark me",
			metadata: {},
		});

		const response = await client.notifications.read.$post(
			{
				json: {
					ids: [created.id],
					markAs: "read",
				},
			},
			{
				headers: authHeaders(),
			},
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.updated).toBe(1);
		expect(payload.status).toBe("read");
	});

	it("executes approval actions requiring comments", async () => {
		const notification = await orchestrator.createNotification({
			userId,
			type: "approval",
			title: "Needs comment",
			message: "Action me",
			metadata: {},
			actions: [
				{
					actionKey: "approve",
					label: "Approve",
					requiresComment: true,
				},
			],
		});

		const response = await client.notifications[":id"]["actions"][":actionKey"].$post(
			{
				param: { id: notification.id, actionKey: "approve" },
				json: {
					comment: "Approved via API test",
				},
			},
			{
				headers: authHeaders(),
			},
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.notificationId).toBe(notification.id);
		expect(payload.actionKey).toBe("approve");
	});
});
