import type { NotificationJobPayload } from "../../../types/notifications";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";

const JOB_TYPE = "email-notification" as const;

export class EmailChannelAdapter implements NotificationChannelAdapter {
	readonly channel = "email" as const;

	async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
		if (channel !== this.channel || !recipients.length) {
			return [];
		}

		const override = request.channelOverrides?.email ?? {};

		const recipientEmails = override.to
			? Array.isArray(override.to)
				? override.to
				: [override.to]
			: recipients
				.map((recipient) => recipient.email)
				.filter((email): email is string => Boolean(email));

		const uniqueEmails = Array.from(new Set(recipientEmails));

		if (!uniqueEmails.length) {
			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "skipped" as const,
				reason: "No email address available",
			}));
		}

		const subject = override.subject ?? request.title;
		const body = override.body ?? request.message;
		const metadata = {
			category: request.category,
			eventType: request.eventType,
			...(request.metadata ?? {}),
			...(override.metadata ?? {}),
		};

		const payload: NotificationJobPayload = {
			email: {
				to: uniqueEmails,
				cc: override.cc,
				subject,
				body,
				attachments: override.attachments,
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

		return recipients.map((recipient) => ({
			userId: recipient.userId,
			channel: this.channel,
			status: "scheduled" as const,
			jobId,
		}));
	}
}

export default EmailChannelAdapter;
