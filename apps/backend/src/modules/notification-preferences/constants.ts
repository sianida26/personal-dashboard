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
	"push",
];

export const DEFAULT_NOTIFICATION_PREFERENCE_MATRIX: Partial<
	Record<NotificationCategoryEnum, Record<NotificationChannelEnum, boolean>>
> = {
	global: {
		inApp: true,
		email: true,
		whatsapp: false,
		push: false,
	},
	general: {
		inApp: true,
		email: true,
		whatsapp: false,
		push: false,
	},
	system: {
		inApp: true,
		email: true,
		whatsapp: false,
		push: false,
	},
};

export const USER_OVERRIDE_SOURCE = "user" as const;
export const DEFAULT_SOURCE = "default" as const;
export const OVERRIDE_SOURCE = "override" as const;
