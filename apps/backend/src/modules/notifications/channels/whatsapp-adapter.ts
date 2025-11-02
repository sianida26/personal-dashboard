import type { NotificationJobPayload } from "../../../types/notifications";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";

const JOB_TYPE = "send-notification" as const;

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
				payload,
				priority: request.jobOptions?.priority,
				maxRetries: request.jobOptions?.maxRetries,
			};

			const jobId = await jobQueueManager.createJob(jobOptions);
			results.push({
				userId: recipient.userId,
				channel: this.channel,
				status: "scheduled" as const,
				jobId,
			});
		}

		return results;
	}
}

export default WhatsAppChannelAdapter;
