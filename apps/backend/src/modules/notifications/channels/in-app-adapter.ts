import type { CreateNotificationInput } from "@repo/validation";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";
import type { InAppNotificationJobPayload } from "../../../jobs/handlers/in-app-notification";

const JOB_TYPE = "in-app-notification" as const;

export class InAppChannelAdapter implements NotificationChannelAdapter {
	readonly channel = "inApp" as const;

	async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
		if (channel !== this.channel || !recipients.length) {
			return [];
		}

		const override = request.channelOverrides?.inApp ?? {};
		const metadata = {
			...(request.metadata ?? {}),
			...(override.metadata ?? {}),
		};

		if (request.eventType) {
			metadata.eventType = request.eventType;
		}

		const payload: CreateNotificationInput = {
			type: override.type ?? request.notificationType ?? "informational",
			title: override.title ?? request.title,
			message: override.message ?? request.message,
			metadata,
			status: override.status ?? "unread",
			category: override.category ?? request.category,
			userIds: recipients.map((recipient) => recipient.userId),
			actions: override.actions,
			expiresAt: override.expiresAt ?? null,
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
				payload: jobPayload as unknown,
				priority: request.jobOptions?.priority,
				maxRetries: request.jobOptions?.maxRetries,
			};

			const jobId = await jobQueueManager.createJob(jobOptions);

			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "scheduled" as const,
				jobId,
			}));
		} catch (error) {
			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "failed" as const,
				reason: error instanceof Error ? error.message : "Unknown error",
			}));
		}
	}
}

export default InAppChannelAdapter;
