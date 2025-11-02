import type {
	NotificationCategoryEnum,
	NotificationChannelEnum,
} from "@repo/validation";

export const NOTIFICATION_CATEGORIES: NotificationCategoryEnum[] = [
	"global",
	"general",
	"leads",
	"projects",
	"tasks",
	"system",
];

export const NOTIFICATION_CHANNELS: NotificationChannelEnum[] = [
	"inApp",
	"email",
	"whatsapp",
	"push",
];

export const DEFAULT_NOTIFICATION_PREFERENCE_MATRIX: Record<
	NotificationCategoryEnum,
	Record<NotificationChannelEnum, boolean>
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
	leads: {
		inApp: true,
		email: true,
		whatsapp: false,
		push: false,
	},
	projects: {
		inApp: true,
		email: true,
		whatsapp: false,
		push: false,
	},
	tasks: {
		inApp: true,
		email: false,
		whatsapp: false,
		push: false,
	},
	system: {
		inApp: true,
		email: true,
		whatsapp: false,
		push: false,
	},
} as const satisfies Record<
	NotificationCategoryEnum,
	Record<NotificationChannelEnum, boolean>
>;

export const USER_OVERRIDE_SOURCE = "user" as const;
export const DEFAULT_SOURCE = "default" as const;
export const OVERRIDE_SOURCE = "override" as const;
