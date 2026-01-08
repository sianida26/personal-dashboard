import type {
	EmailNotificationPayload,
	NotificationCategoryEnum,
	NotificationChannelEnum,
	NotificationPreferenceSourceEnum,
	NotificationPriority,
	NotificationTypeEnum,
	WhatsappNotificationPayload,
} from "@repo/validation";

export interface UnifiedNotificationAudience {
	userId?: string;
	userIds?: string[];
	roleCodes?: string[];
}

export interface UnifiedNotificationChannelOverrides {
	inApp?: Partial<Record<string, unknown>>;
	email?: Partial<EmailNotificationPayload>;
	whatsapp?: Partial<WhatsappNotificationPayload>;
}

export interface UnifiedNotificationRequest
	extends UnifiedNotificationAudience {
	category: NotificationCategoryEnum;
	notificationType?: NotificationTypeEnum;
	eventType?: string;
	title: string;
	message: string;
	metadata?: Record<string, unknown>;
	channels?: NotificationChannelEnum[];
	channelOverrides?: UnifiedNotificationChannelOverrides;
	priority?: NotificationPriority;
	respectPreferences?: boolean;
	jobOptions?: {
		priority?: number;
		maxRetries?: number;
		jobType?: string;
	};
}

export interface NotificationRecipient {
	userId: string;
	name?: string | null;
	email?: string | null;
	phoneNumber?: string | null;
	preferenceSource?: NotificationPreferenceSourceEnum;
}

export interface ChannelDispatchResult {
	userId: string;
	channel: NotificationChannelEnum;
	status: "sent" | "scheduled" | "skipped" | "failed";
	reason?: string;
	jobId?: string;
}

export interface UnifiedNotificationResponse {
	results: ChannelDispatchResult[];
}
