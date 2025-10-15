export const notificationQueryKeys = {
	all: ["notifications"] as const,
	list: (filter: string) => ["notifications", "list", filter] as const,
	unreadCount: ["notifications", "unread-count"] as const,
};
