export type NotificationType = "informational" | "approval";
export type NotificationStatus = "unread" | "read";

export interface NotificationAction {
	id: string;
	notificationId: string;
	actionKey: string;
	label: string;
	requiresComment: boolean;
	createdAt: string;
}

export interface NotificationActionLog {
	id: string;
	notificationId: string;
	actionKey: string;
	actedBy: string;
	comment?: string | null;
	actedAt: string;
}

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	metadata: Record<string, unknown>;
	status: NotificationStatus;
	category?: string | null;
	createdAt: string;
	readAt?: string | null;
	expiresAt?: string | null;
	actions: NotificationAction[];
	actionLogs: NotificationActionLog[];
}

export interface NotificationGroup {
	key: "today" | "yesterday" | "thisWeek" | "earlier";
	title: string;
	notifications: Notification[];
}

export interface PaginatedNotificationsResponse {
	items: Notification[];
	groups: NotificationGroup[];
	nextCursor?: string;
}
