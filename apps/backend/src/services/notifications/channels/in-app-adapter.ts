import { createId } from "@paralleldrive/cuid2";
import type {
	CreateNotificationInput,
	NotificationCategoryEnum,
	NotificationTypeEnum,
} from "@repo/validation";
import type { InAppNotificationJobPayload } from "../../../jobs/handlers/types";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type { JobPriority } from "../../../services/jobs/types";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";

const JOB_TYPE = "in-app-notification" as const;

/**
 * Maps numeric priority to JobPriority string
 */
function mapNumericPriorityToJobPriority(priority?: number): JobPriority {
	switch (priority) {
		case 0:
			return "critical";
		case 1:
			return "high";
		case 2:
			return "normal";
		case 3:
			return "low";
		default:
			return "normal";
	}
}

function isValidNotificationType(
	value: unknown,
): value is NotificationTypeEnum {
	return value === "informational" || value === "approval";
}

function isValidCategory(value: unknown): value is NotificationCategoryEnum {
	return value === "global" || value === "general" || value === "system";
}

export class InAppChannelAdapter implements NotificationChannelAdapter {
	readonly channel = "inApp" as const;

	async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
		if (channel !== this.channel || !recipients.length) {
			return [];
		}

		const override = request.channelOverrides?.inApp ?? {};
		const metadata: Record<string, unknown> = {
			...(request.metadata ?? {}),
			...(typeof override.metadata === "object" && override.metadata
				? override.metadata
				: {}),
		};

		if (request.eventType) {
			metadata.eventType = request.eventType;
		}

		const results = [];

		// Create one job per recipient to avoid duplication
		const uniqueRecipients = Array.from(
			new Map(
				recipients.map((recipient) => [recipient.userId, recipient]),
			).values(),
		);

		for (const recipient of uniqueRecipients) {
			const baseId =
				typeof override.id === "string" ? override.id : undefined;
			const notificationId = baseId
				? `${baseId}_${recipient.userId}`
				: createId();

			const payload: CreateNotificationInput = {
				id: notificationId,
				type: isValidNotificationType(override.type)
					? override.type
					: (request.notificationType ?? "informational"),
				title:
					typeof override.title === "string"
						? override.title
						: request.title,
				message:
					typeof override.message === "string"
						? override.message
						: request.message,
				metadata,
				status: (typeof override.status === "string"
					? override.status
					: "unread") as "unread" | "read",
				category: isValidCategory(override.category)
					? override.category
					: request.category,
				userId: recipient.userId, // Pass single user ID, not array
				actions: Array.isArray(override.actions)
					? override.actions
					: undefined,
				expiresAt:
					override.expiresAt instanceof Date
						? override.expiresAt
						: null,
			};

			if (request.priority) {
				payload.metadata = {
					...payload.metadata,
					priority: request.priority,
				};
			}

			if (override.priority && payload.metadata) {
				payload.metadata.priority = override.priority;
			}

			try {
				const jobPayload: InAppNotificationJobPayload = {
					notification: payload,
				};

				const jobOptions = {
					type: request.jobOptions?.jobType ?? JOB_TYPE,
					payload: jobPayload as unknown as Record<string, unknown>,
					priority: mapNumericPriorityToJobPriority(
						request.jobOptions?.priority,
					),
					maxRetries: request.jobOptions?.maxRetries,
				};

				const jobId = await jobQueueManager.createJob(jobOptions);

				results.push({
					userId: recipient.userId,
					channel: this.channel,
					status: "scheduled" as const,
					jobId,
				});
			} catch (error) {
				results.push({
					userId: recipient.userId,
					channel: this.channel,
					status: "failed" as const,
					reason:
						error instanceof Error
							? error.message
							: "Unknown error",
				});
			}
		}

		return results;
	}
}

export default InAppChannelAdapter;
