import {
	bulkMarkNotificationsSchema,
	createNotificationSchema,
	listNotificationsQuerySchema,
	singleMarkNotificationSchema,
} from "@repo/validation";
import type { Context } from "hono";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { forbidden, unauthorized } from "../../errors/DashboardError";
import notificationEventHub from "../../lib/event-bus/notification-event-hub";
import authInfo from "../../middlewares/authInfo";
import NotificationOrchestrator from "../../modules/notifications/notification-orchestrator";
import type HonoEnv from "../../types/HonoEnv";
import requestValidator from "../../utils/requestValidator";

const orchestrator = new NotificationOrchestrator();

const notificationIdParamSchema = z.object({
	id: z.cuid2(),
});

const actionParamSchema = notificationIdParamSchema.extend({
	actionKey: z.string().min(1).max(50),
});

const actionBodySchema = z.object({
	comment: z.string().max(1000).optional(),
});

const requireUserId = (c: Context<HonoEnv>): string => {
	const uid = c.var.uid;
	if (!uid) {
		throw unauthorized({ message: "User session not found" });
	}
	return uid;
};

const notificationsRoute = new Hono<HonoEnv>()
	.use(authInfo)
	.get(
		"/",
		requestValidator("query", listNotificationsQuerySchema),
		async (c) => {
			const userId = requireUserId(c);
			const query = c.req.valid("query");

			const result = await orchestrator.listNotifications({
				userId,
				status: query.status,
				type: query.type,
				category: query.category,
				before: query.before ? new Date(query.before) : undefined,
				after: query.after ? new Date(query.after) : undefined,
				cursor: query.cursor ? new Date(query.cursor) : undefined,
				limit: query.limit,
			});

			return c.json(result);
		},
	)
	.get("/unread/count", async (c) => {
		const userId = requireUserId(c);
		const count = await orchestrator.getUnreadCount(userId);
		return c.json({ count });
	})
	.get("/stream", async (c) => {
		const userId = requireUserId(c);

		return streamSSE(c, async (stream) => {
			const unsubscribeCreated = notificationEventHub.onCreatedForUser(
				userId,
				async (payload) => {
					await stream.writeSSE({
						event: "notification",
						data: JSON.stringify(payload),
					});
				},
			);

			await new Promise<void>((resolve) => {
				stream.onAbort(async () => {
					unsubscribeCreated();
					resolve();
				});
			});
		});
	})
	.post(
		"/read",
		requestValidator("json", bulkMarkNotificationsSchema),
		async (c) => {
			const userId = requireUserId(c);
			const { ids, markAs } = c.req.valid("json");

			const updated = await orchestrator.markNotifications(
				ids,
				markAs,
				userId,
			);

			return c.json({
				updated,
				status: markAs,
			});
		},
	)
	.post(
		"/:id/read",
		requestValidator("param", notificationIdParamSchema),
		requestValidator("json", singleMarkNotificationSchema),
		async (c) => {
			const userId = requireUserId(c);
			const { id } = c.req.valid("param");
			const { markAs } = c.req.valid("json");

			const updated = await orchestrator.markNotifications(
				[id],
				markAs,
				userId,
			);

			return c.json({
				updated,
				status: markAs,
			});
		},
	)
	.post(
		"/:id/actions/:actionKey",
		requestValidator("param", actionParamSchema),
		requestValidator("json", actionBodySchema),
		async (c) => {
			const actingUserId = requireUserId(c);
			const { id, actionKey } = c.req.valid("param");
			const { comment } = c.req.valid("json");

			const log = await orchestrator.executeAction({
				notificationId: id,
				actionKey,
				actedBy: actingUserId,
				comment,
			});

			return c.json(log);
		},
	)
	.post(
		"/",
		requestValidator("json", createNotificationSchema),
		async (c) => {
			const { currentUser } = c.var;

			if (!currentUser?.roles.includes("super-admin")) {
				forbidden({
					message:
						"AI-FOLLOWUP: restrict notification creation endpoint to internal integrations",
				});
			}

			const payload = c.req.valid("json");
			const notifications =
				await orchestrator.createNotification(payload);

			return c.json(
				{
					notifications,
					recipients: notifications.map((item) => item.userId),
				},
				201,
			);
		},
	);

export default notificationsRoute;
