import type {
	ChannelDispatchResult,
	NotificationRecipient,
	UnifiedNotificationRequest,
} from "../unified-notification-types";
import type { NotificationChannelEnum } from "@repo/validation";

export interface ChannelDeliveryRequest {
	channel: NotificationChannelEnum;
	recipients: NotificationRecipient[];
	request: UnifiedNotificationRequest;
}

export interface NotificationChannelAdapter {
	readonly channel: NotificationChannelEnum;
	deliver(request: ChannelDeliveryRequest): Promise<ChannelDispatchResult[]>;
}
