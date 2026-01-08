import notificationEventHub from "../../lib/event-bus/notification-event-hub";
import createNotificationRepository from "../../services/notifications/notification-repository";
import type { JobHandler } from "../../services/jobs/types";
import type { InAppNotificationJobPayload } from "./types";

// Re-export for backward compatibility
export type { InAppNotificationJobPayload };

const notificationRepository = createNotificationRepository();

const inAppNotificationHandler: JobHandler<InAppNotificationJobPayload> = {
	type: "in-app-notification",
	description: "Create in-app notifications",
	defaultMaxRetries: 3,
	defaultTimeoutSeconds: 30,

	async execute(payload, context) {
		const { notification } = payload;

		try {
			// Each job should only have a single userId
			// The adapter creates one job per recipient to avoid duplication
			if (!notification.userId) {
				throw new Error("userId is required in the job payload");
			}

			context.logger.info(
				`Creating in-app notification for user: ${notification.userId}`,
			);

			const created = await notificationRepository.createNotification({
				type: notification.type,
				title: notification.title,
				message: notification.message,
				userId: notification.userId,
				metadata: notification.metadata || {},
				status: notification.status || "unread",
				category: notification.category,
				actions: notification.actions?.map((action) => ({
					actionKey: action.actionKey,
					label: action.label,
					requiresComment: action.requiresComment ?? false,
				})),
				expiresAt: notification.expiresAt ?? null,
			});

			// Emit created event using the singleton event hub
			notificationEventHub.emit("created", {
				...created,
				metadata: created.metadata || {},
			});

			context.logger.info(
				`In-app notification created successfully for recipient ${notification.userId}`,
			);

			return {
				success: true,
				message: `Created in-app notification for recipient ${notification.userId}`,
			};
		} catch (error) {
			const errorMsg = new Error(
				`Failed to create in-app notification: ${(error as Error).message}`,
			);
			context.logger.error(errorMsg);

			return {
				success: false,
				message: (error as Error).message,
				shouldRetry: true,
			};
		}
	},

	async onFailure(error, context) {
		const errorMsg = new Error(
			`In-app notification failed permanently for job ${context.jobId}: ${error.message}`,
		);
		context.logger.error(errorMsg);
	},

	async onSuccess(_result, context) {
		context.logger.info(
			`In-app notification completed successfully for job ${context.jobId}`,
		);
	},
};

export default inAppNotificationHandler;
