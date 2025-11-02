import type { CreateNotificationInput } from "@repo/validation";
import type { JobHandler } from "../../services/jobs/types";
import createNotificationRepository from "../../modules/notifications/notification-repository";
import { NotificationEventHub } from "../../lib/event-bus/notification-event-hub";

export interface InAppNotificationJobPayload extends Record<string, unknown> {
	notification: CreateNotificationInput & {
		priority?: string;
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
				`Creating in-app notification for user(s): ${notification.userId || (notification.userIds ? notification.userIds.join(", ") : "N/A")}`,
			);

			// Resolve recipients from userId, userIds, and roleCodes
			const recipients = new Set<string>();

			if (notification.userId) {
				recipients.add(notification.userId);
			}

			notification.userIds?.forEach((userId: string) => {
				if (userId) {
					recipients.add(userId);
				}
			});

			if (notification.roleCodes?.length) {
				const idsFromRoles =
					await notificationRepository.findUserIdsByRoleCodes(
						notification.roleCodes,
					);
				for (const id of idsFromRoles) recipients.add(id);
			}

			// Create notification records for each recipient in a transaction
			for (const recipientId of recipients) {
				const created = await notificationRepository.createNotification(
					{
						type: notification.type,
						title: notification.title,
						message: notification.message,
						userId: recipientId,
						metadata: notification.metadata || {},
						status: "unread",
						category: notification.category,
						expiresAt: notification.expiresAt ?? null,
					},
				);

				// Emit event so frontend gets real-time SSE update
				notificationEventHub.emit("created", created);
			}

			context.logger.info(
				`Successfully created in-app notifications for ${recipients.size} recipient(s)`,
			);

			return {
				success: true,
				message: `Created for ${recipients.size} recipient(s)`,
			};
		} catch (error) {
			const errorObj =
				error instanceof Error ? error : new Error(String(error));
			context.logger.error(errorObj);
			throw errorObj;
		}
	},
};

export default inAppNotificationHandler;
