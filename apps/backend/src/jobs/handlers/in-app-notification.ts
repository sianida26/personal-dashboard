import type { CreateNotificationInput } from "@repo/validation";
import { NotificationEventHub } from "../../lib/event-bus/notification-event-hub";
import createNotificationRepository from "../../modules/notifications/notification-repository";
import type { JobHandler, JobPriority } from "../../services/jobs/types";

export interface InAppNotificationJobPayload extends Record<string, unknown> {
	notification: CreateNotificationInput & {
		priority?: JobPriority;
	};
}

const notificationRepository = createNotificationRepository();
const notificationEventHub = new NotificationEventHub();

const inAppNotificationHandler: JobHandler<InAppNotificationJobPayload> = {
	type: "in-app-notification",
	description: "Create in-app notifications",
	defaultMaxRetries: 3,
	defaultTimeoutSeconds: 30,

	async execute(payload, context) {
		const { notification } = payload;

		try {
			context.logger.info(
				`Creating in-app notification for user: ${notification.userId || "N/A"}`,
			);

			// Resolve recipients - handle both single userId and roleCode expansion
			const recipients = new Set<string>();

			if (notification.userId) {
				recipients.add(notification.userId);
			}

			// Note: userIds array should NOT be used in the job payload anymore
			// Each recipient gets a separate job with their own userId
			if (notification.userIds?.length) {
				notification.userIds.forEach((userId: string) => {
					if (userId) {
						recipients.add(userId);
					}
				});
			}

			if (notification.roleCodes?.length) {
				const idsFromRoles =
					await notificationRepository.findUserIdsByRoleCodes(
						notification.roleCodes,
					);
				idsFromRoles.forEach((userId) => {
					recipients.add(userId);
				});
			}

			if (recipients.size === 0) {
				throw new Error("No recipients resolved for notification");
			}

			// Create notification for each recipient
			for (const recipientId of recipients) {
				const created = await notificationRepository.createNotification(
					{
						type: notification.type,
						title: notification.title,
						message: notification.message,
						userId: recipientId,
						metadata: notification.metadata || {},
						status: notification.status || "unread",
						category: notification.category,
						actions: notification.actions?.map((action) => ({
							actionKey: action.actionKey,
							label: action.label,
							requiresComment: action.requiresComment ?? false,
						})),
						expiresAt: notification.expiresAt ?? null,
					},
				);

				// Emit created event
				notificationEventHub.emit("created", {
					...created,
					metadata: created.metadata || {},
				});
			}

			context.logger.info(
				`In-app notification created successfully for ${recipients.size} recipient(s)`,
			);

			return {
				success: true,
				message: `Created in-app notification for ${recipients.size} recipient(s)`,
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
