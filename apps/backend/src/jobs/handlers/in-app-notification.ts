import type { CreateNotificationInput } from "@repo/validation";
import type { JobHandler } from "../../services/jobs/types";
import createNotificationRepository from "../../modules/notifications/notification-repository";
import { NotificationEventHub } from "../../lib/event-bus/notification-event-hub";

<<<<<<< HEAD
export interface InAppNotificationJobPayload {
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
				const idsFromRoles = await notificationRepository.findUserIdsByRoleCodes(
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
				const created = await notificationRepository.createNotification({
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
				});

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
||||||| d08ce3c7
=======
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
>>>>>>> main
	},
};

export default inAppNotificationHandler;
