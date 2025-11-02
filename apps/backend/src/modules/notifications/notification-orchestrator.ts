import { createId } from "@paralleldrive/cuid2";
import type {
	CreateNotificationInput,
	NotificationActionExecutionInput,
	NotificationStatusEnum,
} from "@repo/validation";
import type {
	NotificationActionLogRecord,
	NotificationActionRecord,
	NotificationRecord,
} from "../../drizzle/schema/notifications";
import notificationEventHub, {
	type NotificationEventHub,
} from "../../lib/event-bus/notification-event-hub";
import createNotificationRepository, {
	type ListNotificationsParams,
	type NotificationRepository,
} from "./notification-repository";

export type NotificationViewModel = NotificationRecord & {
	actions: NotificationActionRecord[];
	actionLogs: NotificationActionLogRecord[];
};

export interface NotificationGroup {
	key: "today" | "yesterday" | "thisWeek" | "earlier";
	title: string;
	notifications: NotificationViewModel[];
}

export interface NotificationListResult {
	items: NotificationViewModel[];
	groups: NotificationGroup[];
	nextCursor?: string;
}

export interface NotificationOrchestratorOptions {
	repository?: NotificationRepository;
	eventHub?: NotificationEventHub;
}

const startOfDay = (date: Date) => {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
};

const diffInDays = (a: Date, b: Date) => {
	const msInDay = 86_400_000;
	const diff = startOfDay(a).getTime() - startOfDay(b).getTime();
	return Math.round(diff / msInDay);
};

const resolveGroupTitle = (createdAt: Date, now = new Date()) => {
	const created = startOfDay(createdAt);
	const today = startOfDay(now);
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	if (created.getTime() === today.getTime()) {
		return { key: "today", title: "Today" } as const;
	}

	if (created.getTime() === yesterday.getTime()) {
		return { key: "yesterday", title: "Yesterday" } as const;
	}

	const dayDiff = diffInDays(today, created);

	if (dayDiff <= 7) {
		return { key: "thisWeek", title: "This Week" } as const;
	}

	return { key: "earlier", title: "Earlier" } as const;
};

const normalizeMetadata = (
	metadata: NotificationRecord["metadata"],
): Record<string, unknown> => {
	if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
		return metadata as Record<string, unknown>;
	}

	return {};
};

export class NotificationOrchestrator {
	private repository: NotificationRepository;
	private eventHub: NotificationEventHub;

	constructor(options: NotificationOrchestratorOptions = {}) {
		this.repository = options.repository ?? createNotificationRepository();
		this.eventHub = options.eventHub ?? notificationEventHub;
	}

	async listNotifications(
		params: ListNotificationsParams & { userId: string },
	): Promise<NotificationListResult> {
		const result = await this.repository.listNotificationsForUser(params);

		const items = result.map((record) => ({
			...record,
			metadata: normalizeMetadata(record.metadata),
		}));

		const groupsMap = new Map<
			NotificationGroup["key"],
			NotificationGroup
		>();

		for (const item of items) {
			const { key, title } = resolveGroupTitle(item.createdAt);
			const group = groupsMap.get(key);

			if (group) {
				group.notifications.push(item);
			} else {
				groupsMap.set(key, {
					key,
					title,
					notifications: [item],
				});
			}
		}

		const groups = Array.from(groupsMap.values());

		const nextCursor = items.length
			? items[items.length - 1]?.createdAt.toISOString()
			: undefined;

		return {
			items,
			groups,
			nextCursor,
		};
	}

	async markNotifications(
		ids: string[],
		status: NotificationStatusEnum,
		userId: string,
	): Promise<number> {
		const updated = await this.repository.markNotifications(ids, status);

		if (updated) {
			this.eventHub.emit("read", {
				userId,
				ids,
				status,
			});
		}

		return updated;
	}

	async executeAction(
		input: NotificationActionExecutionInput & { actedBy: string },
	): Promise<NotificationActionLogRecord> {
		const notification = await this.repository.getNotificationById(
			input.notificationId,
		);

		if (!notification) {
			throw new Error("Notification not found");
		}

		if (notification.type !== "approval") {
			throw new Error(
				"Actions can only be executed for approval notifications",
			);
		}

		const action = notification.actions.find(
			(item) => item.actionKey === input.actionKey,
		);

		if (!action) {
			throw new Error("Action not registered for notification");
		}

		if (action.requiresComment && !input.comment) {
			throw new Error("Comment is required for this action");
		}

		const log = await this.repository.recordActionLog({
			notificationId: notification.id,
			actionKey: action.actionKey,
			actedBy: input.actedBy,
			comment: input.comment,
		});

		// Mark notification as read when actioned
		await this.repository.markNotifications(
			[notification.id],
			"read" satisfies NotificationStatusEnum,
		);

		this.eventHub.emit("actioned", log);

		return log;
	}

	async getUnreadCount(userId: string): Promise<number> {
		return this.repository.countUnread(userId);
	}
}

export const createNotificationOrchestrator = (
	options?: NotificationOrchestratorOptions,
) => new NotificationOrchestrator(options);

export default NotificationOrchestrator;
