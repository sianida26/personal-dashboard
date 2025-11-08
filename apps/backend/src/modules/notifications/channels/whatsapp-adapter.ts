import type { WhatsAppNotificationPayload } from "../../../types/notifications";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type { JobPriority } from "../../../services/jobs/types";
import whatsappService from "../../../services/whatsapp/whatsapp-service";
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

		if (!whatsappService.isReady()) {
			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "failed" as const,
				reason: "WhatsApp service not configured",
			}));
		}

		const override = request.channelOverrides?.whatsapp ?? {};
		const overrideMetadata = (override.metadata ??
			{}) as Record<string, unknown>;
		const results = [];

		const uniqueRecipients = Array.from(
			new Map(
				recipients.map((recipient) => [recipient.userId, recipient]),
			).values(),
		);

		for (const recipient of uniqueRecipients) {
			const metadataRecord = (request.metadata ??
				{}) as Record<string, unknown>;
			const metadataPhone =
				typeof metadataRecord.phoneNumber === "string"
					? metadataRecord.phoneNumber.trim()
					: typeof metadataRecord.contactPhone === "string"
						? metadataRecord.contactPhone.trim()
						: undefined;
			const overridePhone =
				typeof override.phoneNumber === "string"
					? override.phoneNumber.trim()
					: undefined;
			const recipientPhone =
				typeof recipient.phoneNumber === "string"
					? recipient.phoneNumber.trim()
					: undefined;
			const overrideMetadataPhone =
				typeof overrideMetadata.phoneNumber === "string"
					? overrideMetadata.phoneNumber.trim()
					: typeof overrideMetadata.contactPhone === "string"
						? overrideMetadata.contactPhone.trim()
						: undefined;
			const phoneNumber =
				overridePhone ||
				overrideMetadataPhone ||
				metadataPhone ||
				recipientPhone;
			if (!phoneNumber) {
				results.push({
					userId: recipient.userId,
					channel: this.channel,
					status: "skipped" as const,
					reason: "No phone number available",
				});
				continue;
			}

			let message: string | undefined;
			if (typeof override.message === "string") {
				const trimmed = override.message.trim();
				if (trimmed.length > 0) {
					message = trimmed;
				}
			}
			if (!message && typeof request.message === "string") {
				message = request.message;
			}
			if (!message) {
				results.push({
					userId: recipient.userId,
					channel: this.channel,
					status: "skipped" as const,
					reason: "No message content provided",
				});
				continue;
			}

			const session =
				typeof override.session === "string"
					? override.session.trim()
					: undefined;
			const linkPreview =
				typeof override.linkPreview === "boolean"
					? override.linkPreview
					: undefined;
			const linkPreviewHighQuality =
				typeof override.linkPreviewHighQuality === "boolean"
					? override.linkPreviewHighQuality
					: undefined;
			const metadata = {
				category: request.category,
				eventType: request.eventType,
				...(request.metadata ?? {}),
				...(override.metadata ?? {}),
			};

			const payload: WhatsAppNotificationPayload = {
				phoneNumber,
				message,
				metadata,
				session,
				linkPreview,
				linkPreviewHighQuality,
			};

			const jobOptions = {
				type: request.jobOptions?.jobType ?? JOB_TYPE,
				payload,
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
