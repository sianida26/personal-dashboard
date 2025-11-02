import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import db from "../../drizzle";
import type {
	NotificationStatusEnum,
	NotificationTypeEnum,
} from "@repo/validation";
import {
	notifications,
	notificationActions,
	notificationActionLogs,
	type NotificationInsert,
	type NotificationActionInsert,
	type NotificationActionLogInsert,
} from "../../drizzle/schema/notifications";
import { rolesSchema } from "../../drizzle/schema/roles";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";

export type DatabaseClient = typeof db;

export interface ListNotificationsParams {
	userId: string;
	status?: NotificationStatusEnum;
	type?: NotificationTypeEnum;
	category?: string;
	before?: Date;
	after?: Date;
	cursor?: Date;
	limit?: number;
}

export interface NotificationRepository {
	createNotification: (
		data: NotificationInsert & {
			actions?: Omit<NotificationActionInsert, "notificationId">[];
		},
	) => Promise<
		typeof notifications.$inferSelect & {
			actions: (typeof notificationActions.$inferSelect)[];
			actionLogs: (typeof notificationActionLogs.$inferSelect)[];
		}
	>;
	listNotificationsForUser: (params: ListNotificationsParams) => Promise<
		Array<
			typeof notifications.$inferSelect & {
				actions: (typeof notificationActions.$inferSelect)[];
				actionLogs: (typeof notificationActionLogs.$inferSelect)[];
			}
		>
	>;
	getNotificationById: (id: string) => Promise<
		| (typeof notifications.$inferSelect & {
				actions: (typeof notificationActions.$inferSelect)[];
				actionLogs: (typeof notificationActionLogs.$inferSelect)[];
		  })
		| undefined
	>;
	markNotifications: (
		ids: string[],
		status: NotificationStatusEnum,
	) => Promise<number>;
	recordActionLog: (
		data: NotificationActionLogInsert,
	) => Promise<typeof notificationActionLogs.$inferSelect>;
	countUnread: (userId: string) => Promise<number>;
	findUserIdsByRoleCodes: (roleCodes: string[]) => Promise<string[]>;
}

const buildTemporalFilters = (query: ListNotificationsParams) => {
	const filters = [eq(notifications.userId, query.userId)] as Array<
		ReturnType<typeof eq>
	>;

	if (query.status) {
		filters.push(eq(notifications.status, query.status));
	}

	if (query.type) {
		filters.push(eq(notifications.type, query.type));
	}

	if (query.category) {
		filters.push(eq(notifications.category, query.category));
	}

	if (query.before) {
		filters.push(lt(notifications.createdAt, query.before));
	}

	if (query.after) {
		filters.push(gt(notifications.createdAt, query.after));
	}

	if (query.cursor) {
		filters.push(lt(notifications.createdAt, query.cursor));
	}

	return and(...filters);
};

export const createNotificationRepository = (
	database: DatabaseClient = db,
): NotificationRepository => {
	const listNotificationsForUser: NotificationRepository["listNotificationsForUser"] =
		async ({ limit = 20, ...filters }) => {
			const safeLimit = Math.min(Math.max(limit, 1), 50);
			const where = buildTemporalFilters(filters);

			return database.query.notifications.findMany({
				where,
				orderBy: desc(notifications.createdAt),
				with: {
					actions: true,
					actionLogs: true,
				},
				limit: safeLimit,
			});
		};

	const createNotification: NotificationRepository["createNotification"] =
		async ({ actions, ...notification }) => {
			return database.transaction(async (tx) => {
				const [created] = await tx
					.insert(notifications)
					.values(notification)
					.returning();

				if (!created) {
					throw new Error(
						"Failed to insert notification record for unknown reasons",
					);
				}

				let insertedActions: (typeof notificationActions.$inferSelect)[] =
					[];

				if (actions?.length) {
					insertedActions = await tx
						.insert(notificationActions)
						.values(
							actions.map(
								(action) =>
									({
										id: action.id ?? createId(),
										notificationId: created.id,
										...action,
									}) satisfies NotificationActionInsert,
							),
						)
						.returning();
				}

				return {
					...created,
					actions: insertedActions,
					actionLogs: [],
				};
			});
		};

	const getNotificationById: NotificationRepository["getNotificationById"] =
		async (id) => {
			return database.query.notifications.findFirst({
				where: eq(notifications.id, id),
				with: {
					actions: true,
					actionLogs: true,
				},
			});
		};

	const markNotifications: NotificationRepository["markNotifications"] =
		async (ids, status) => {
			if (!ids.length) {
				return 0;
			}

			const result = await database
				.update(notifications)
				.set({
					status,
					readAt: status === "read" ? new Date() : null,
				})
				.where(inArray(notifications.id, ids))
				.returning({ id: notifications.id });

			return result.length;
		};

	const recordActionLog: NotificationRepository["recordActionLog"] = async ({
		id,
		...rest
	}) => {
		const [log] = await database
			.insert(notificationActionLogs)
			.values({
				id: id ?? createId(),
				...rest,
			})
			.returning();

		if (!log) {
			throw new Error("Failed to persist action log");
		}

		return log;
	};

	return {
		createNotification,
		listNotificationsForUser,
		getNotificationById,
		markNotifications,
		recordActionLog,
		countUnread: async (userId) => {
			const [result] = await database
				.select({
					count: sql<number>`count(*)`,
				})
				.from(notifications)
				.where(
					and(
						eq(notifications.userId, userId),
						eq(notifications.status, "unread"),
					),
				);

			return Number(result?.count ?? 0);
		},
		findUserIdsByRoleCodes: async (roleCodes) => {
			if (!roleCodes?.length) {
				return [];
			}

			const rows = await database
				.select({ userId: rolesToUsers.userId })
				.from(rolesToUsers)
				.innerJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
				.where(inArray(rolesSchema.code, roleCodes));

			return Array.from(new Set(rows.map((row) => row.userId)));
		},
	};
};

export default createNotificationRepository;
