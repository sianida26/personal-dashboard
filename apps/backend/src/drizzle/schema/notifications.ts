import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	varchar,
	date,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
	"informational",
	"approval",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
	"unread",
	"read",
]);

export const notifications = pgTable(
	"notifications",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		title: text("title").notNull(),
		message: text("message").notNull(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		status: notificationStatusEnum("status").notNull().default("unread"),
		category: varchar("category", { length: 50 }),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		readAt: timestamp("read_at", {
			mode: "date",
			withTimezone: true,
		}),
		expiresAt: timestamp("expires_at", {
			mode: "date",
			withTimezone: true,
		}),
		groupKey: date("group_key"),
	},
	(table) => ({
		userStatusIdx: index("idx_notifications_user_status").on(
			table.userId,
			table.status,
		),
		userGroupIdx: index("idx_notifications_group_key").on(
			table.userId,
			table.groupKey,
		),
		userCreatedIdx: index("idx_notifications_created_at").on(
			table.userId,
			table.createdAt,
		),
	}),
);

export const notificationActions = pgTable(
	"notification_actions",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		notificationId: varchar("notification_id", { length: 25 })
			.notNull()
			.references(() => notifications.id, { onDelete: "cascade" }),
		actionKey: varchar("action_key", { length: 50 }).notNull(),
		label: varchar("label", { length: 100 }).notNull(),
		requiresComment: boolean("requires_comment").notNull().default(false),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		notificationIdx: index(
			"idx_notification_actions_notification_id",
		).on(table.notificationId),
	}),
);

export const notificationActionLogs = pgTable(
	"notification_action_logs",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		notificationId: varchar("notification_id", { length: 25 })
			.notNull()
			.references(() => notifications.id, { onDelete: "cascade" }),
		actionKey: varchar("action_key", { length: 50 }).notNull(),
		actedBy: text("acted_by")
			.notNull()
			.references(() => users.id, { onDelete: "no action" }),
		comment: text("comment"),
		actedAt: timestamp("acted_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		notificationIdx: index(
			"idx_notification_action_logs_notification_id",
		).on(table.notificationId),
	}),
);

export const notificationsRelations = relations(
	notifications,
	({ one, many }) => ({
		user: one(users, {
			fields: [notifications.userId],
			references: [users.id],
		}),
		actions: many(notificationActions),
		actionLogs: many(notificationActionLogs),
	}),
);

export const notificationActionsRelations = relations(
	notificationActions,
	({ one }) => ({
		notification: one(notifications, {
			fields: [notificationActions.notificationId],
			references: [notifications.id],
		}),
	}),
);

export const notificationActionLogsRelations = relations(
	notificationActionLogs,
	({ one }) => ({
		notification: one(notifications, {
			fields: [notificationActionLogs.notificationId],
			references: [notifications.id],
		}),
		user: one(users, {
			fields: [notificationActionLogs.actedBy],
			references: [users.id],
		}),
	}),
);

export type NotificationRecord = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationActionRecord = typeof notificationActions.$inferSelect;
export type NotificationActionInsert = typeof notificationActions.$inferInsert;
export type NotificationActionLogRecord =
	typeof notificationActionLogs.$inferSelect;
export type NotificationActionLogInsert =
	typeof notificationActionLogs.$inferInsert;
