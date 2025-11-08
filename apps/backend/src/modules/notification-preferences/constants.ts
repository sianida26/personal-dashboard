import type {
	NotificationCategoryEnum,
	NotificationChannelEnum,
} from "@repo/validation";

export const NOTIFICATION_CATEGORIES: NotificationCategoryEnum[] = [
	"global",
	"general",
	"system",
];

export const NOTIFICATION_CHANNELS: NotificationChannelEnum[] = [
	"inApp",
	"email",
	"whatsapp",
];

// Updated: All channels enabled by default for all categories
// Note: inApp channel includes browser native push notifications
export const DEFAULT_NOTIFICATION_PREFERENCE_MATRIX: Partial<
	Record<NotificationCategoryEnum, Record<NotificationChannelEnum, boolean>>
> = {
	global: {
		inApp: true,
		email: true,
		whatsapp: true,
	},
	general: {
		inApp: true,
		email: true,
		whatsapp: true,
	},
	system: {
		inApp: true,
		email: true,
		whatsapp: true,
	},
};

export const USER_OVERRIDE_SOURCE = "user" as const;
export const DEFAULT_SOURCE = "default" as const;
export const OVERRIDE_SOURCE = "override" as const;
