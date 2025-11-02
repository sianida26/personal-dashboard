import type { CreateNotificationInput } from "@repo/validation";
import NotificationOrchestrator from "../notification-orchestrator";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";

export class InAppChannelAdapter implements NotificationChannelAdapter {
	readonly channel = "inApp" as const;

	constructor(private readonly orchestrator: NotificationOrchestrator) {}

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
			await this.orchestrator.createNotification(payload);
			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "sent" as const,
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
