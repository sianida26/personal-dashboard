import type { NotificationJobPayload } from "../../../types/notifications";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type { JobPriority } from "../../../services/jobs/types";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";

const JOB_TYPE = "whatsapp-notification" as const;

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

export class WhatsAppChannelAdapter implements NotificationChannelAdapter {
	readonly channel = "whatsapp" as const;

	async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
		if (channel !== this.channel || !recipients.length) {
			return [];
		}

		const override = request.channelOverrides?.whatsapp ?? {};
		const results = [];

		for (const recipient of recipients) {
			const phoneNumber = override.phoneNumber ?? recipient.phoneNumber;
			if (!phoneNumber) {
				results.push({
					userId: recipient.userId,
					channel: this.channel,
					status: "skipped" as const,
					reason: "No phone number available",
				});
				continue;
			}

			const message = override.message ?? request.message;
			const metadata = {
				category: request.category,
				eventType: request.eventType,
				...(request.metadata ?? {}),
				...(override.metadata ?? {}),
			};

			const payload: NotificationJobPayload = {
				whatsapp: {
					phoneNumber,
					message,
					metadata,
				},
			};

			const jobOptions = {
				type: request.jobOptions?.jobType ?? JOB_TYPE,
				payload: payload as unknown as Record<string, unknown>,
				priority: mapNumericPriorityToJobPriority(
					request.jobOptions?.priority,
				),
				maxRetries: request.jobOptions?.maxRetries,
			};

			try {
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

export default WhatsAppChannelAdapter;
