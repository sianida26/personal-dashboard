import { bulkUpsertNotificationPreferencesSchema } from "@repo/validation";
import { Hono } from "hono";
import type { Context } from "hono";
import authInfo from "../../middlewares/authInfo";
import type HonoEnv from "../../types/HonoEnv";
import requestValidator from "../../utils/requestValidator";
import notificationPreferenceService from "../../modules/notification-preferences/notification-preferences-service";
import {
	DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
	NOTIFICATION_CATEGORIES,
	NOTIFICATION_CHANNELS,
} from "../../modules/notification-preferences/constants";
import { unauthorized } from "../../errors/DashboardError";

const requireUserId = (c: Context<HonoEnv>): string => {
	const uid = c.var.uid;
	if (!uid) {
		throw unauthorized({ message: "User session not found" });
	}
	return uid;
};

const notificationPreferencesRoute = new Hono<HonoEnv>()
	.use(authInfo)
	.get("/", async (c) => {
		const userId = requireUserId(c);
		const summary =
			await notificationPreferenceService.getUserPreferences(userId);
		return c.json(summary);
	})
	.put(
		"/",
		requestValidator("json", bulkUpsertNotificationPreferencesSchema),
		async (c) => {
			const userId = requireUserId(c);
			const body = c.req.valid("json");

			await notificationPreferenceService.updateUserPreferences(
				userId,
				body,
			);

			const summary =
				await notificationPreferenceService.getUserPreferences(userId);
			return c.json(summary);
		},
	)
	.get("/defaults", (c) => {
		return c.json({
			categories: NOTIFICATION_CATEGORIES,
			channels: NOTIFICATION_CHANNELS,
			matrix: DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
		} satisfies {
			categories: typeof NOTIFICATION_CATEGORIES;
			channels: typeof NOTIFICATION_CHANNELS;
			matrix: typeof DEFAULT_NOTIFICATION_PREFERENCE_MATRIX;
		});
	});

export default notificationPreferencesRoute;
