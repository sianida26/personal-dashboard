import client from "@/honoClient";
import type {
	NotificationStatus,
	Notification,
	PaginatedNotificationsResponse,
} from "./types";

export interface NotificationListQuery {
	status?: NotificationStatus;
	type?: Notification["type"];
	category?: string;
}

const ensureOk = async (response: Response) => {
	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || "Request failed");
	}
	return response;
};

export const fetchNotifications = async (
	queryParams: NotificationListQuery = {},
): Promise<PaginatedNotificationsResponse> => {
	const response = await client.notifications.$get({
		query: Object.fromEntries(
			Object.entries(queryParams).filter(
				([, value]) => value !== undefined && value !== "",
			),
		),
	});

	await ensureOk(response);
	return (await response.json()) as PaginatedNotificationsResponse;
};

export const markNotifications = async (
	ids: string[],
	markAs: NotificationStatus,
) => {
	const response = await client.notifications.read.$post({
		json: { ids, markAs },
	});

	await ensureOk(response);
	return response.json();
};

export const markNotification = async (
	id: string,
	markAs: NotificationStatus,
) => {
	const response = await client.notifications[":id"].read.$post({
		param: { id },
		json: { markAs },
	});

	await ensureOk(response);
	return response.json();
};

export const executeNotificationAction = async (
	notificationId: string,
	actionKey: string,
	comment?: string,
) => {
	const response =
		await client.notifications[":id"].actions[":actionKey"].$post({
			param: { id: notificationId, actionKey },
			json: comment ? { comment } : {},
		});

	await ensureOk(response);
	return response.json();
};

export const fetchUnreadCount = async (): Promise<number> => {
	const response = await client.notifications.unread.count.$get();
	await ensureOk(response);
	const payload = (await response.json()) as { count: number };
	return payload.count;
};
