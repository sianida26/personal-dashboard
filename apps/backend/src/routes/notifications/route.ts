import {
	bulkMarkNotificationsSchema,
	createNotificationSchema,
	listNotificationsQuerySchema,
	singleMarkNotificationSchema,
} from "@repo/validation";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { forbidden, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import NotificationOrchestrator from "../../modules/notifications/notification-orchestrator";
import type HonoEnv from "../../types/HonoEnv";
import { sendToUsersAndRoles } from "../../utils/notifications/notification-helpers";
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
			const includeRead = query.includeRead ?? false;

			const result = await orchestrator.listNotifications({
				userId,
				status: includeRead ? undefined : query.status,
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
	.post(
		"/read",
		requestValidator("json", bulkMarkNotificationsSchema),
		async (c) => {
			const userId = requireUserId(c);
			const { ids, markAs } = c.req.valid("json");

			try {
				const updated = await orchestrator.markNotifications(
					ids,
					markAs,
					userId,
				);

				return c.json({
					updated,
					status: markAs,
				});
			} catch (error) {
				if (error instanceof Error) {
					forbidden({
						message: error.message,
					});
				}
				throw error;
			}
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

			try {
				const updated = await orchestrator.markNotifications(
					[id],
					markAs,
					userId,
				);

				return c.json({
					updated,
					status: markAs,
				});
			} catch (error) {
				if (error instanceof Error) {
					forbidden({
						message: error.message,
					});
				}
				throw error;
			}
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

			try {
				const log = await orchestrator.executeAction({
					notificationId: id,
					actionKey,
					actedBy: actingUserId,
					comment,
				});

				return c.json(log);
			} catch (error) {
				if (error instanceof Error) {
					forbidden({
						message: error.message,
					});
				}
				throw error;
			}
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

			// Use the new unified notification service
			const result = await sendToUsersAndRoles({
				userIds: payload.userId ? [payload.userId] : payload.userIds,
				roleCodes: payload.roleCodes,
				category: payload.category,
				type: payload.type,
				title: payload.title,
				message: payload.message,
				channels: payload.channels,
				channelOverrides: payload.channelOverrides,
				metadata: payload.metadata || {},
				respectPreferences: payload.respectPreferences ?? true,
			});

			return c.json(
				{
					message: "Notification dispatched",
					results: result.results,
				},
				201,
			);
		},
	);

export default notificationsRoute;
