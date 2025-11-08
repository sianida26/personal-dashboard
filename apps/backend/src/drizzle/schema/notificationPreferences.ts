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
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationPreferenceCategoryEnum = pgEnum(
	"notification_preference_category",
	["global", "general", "system"],
);

export const notificationChannelEnum = pgEnum("notification_channel", [
	"inApp",
	"email",
	"whatsapp",
]);

export const notificationPreferenceSourceEnum = pgEnum(
	"notification_preference_source",
	["default", "user", "override"],
);

export interface NotificationDeliveryWindow {
	startHour: number;
	endHour: number;
	timezone?: string | null;
	daysOfWeek?: number[] | null;
}

export const userNotificationPreferences = pgTable(
	"user_notification_preferences",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		category: notificationPreferenceCategoryEnum("category").notNull(),
		channel: notificationChannelEnum("channel").notNull(),
		enabled: boolean("enabled").notNull().default(true),
		deliveryWindow: jsonb("delivery_window")
			.$type<NotificationDeliveryWindow | null>()
			.default(null),
		source: notificationPreferenceSourceEnum("source")
			.notNull()
			.default("default"),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userCategoryChannelIdx: uniqueIndex(
			"idx_user_notification_preferences_user_category_channel",
		).on(table.userId, table.category, table.channel),
		categoryIdx: index("idx_user_notification_preferences_category").on(
			table.category,
		),
		channelIdx: index("idx_user_notification_preferences_channel").on(
			table.channel,
		),
	}),
);

export const notificationChannelOverrides = pgTable(
	"notification_channel_overrides",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		category: notificationPreferenceCategoryEnum("category").notNull(),
		channel: notificationChannelEnum("channel").notNull(),
		enforced: boolean("enforced").notNull().default(true),
		reason: text("reason"),
		effectiveFrom: timestamp("effective_from", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		effectiveTo: timestamp("effective_to", {
			mode: "date",
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		categoryChannelUniqueIdx: uniqueIndex(
			"idx_notification_channel_overrides_category_channel",
		).on(table.category, table.channel),
	}),
);

export const userNotificationPreferencesRelations = relations(
	userNotificationPreferences,
	({ one }) => ({
		user: one(users, {
			fields: [userNotificationPreferences.userId],
			references: [users.id],
		}),
	}),
);

export type UserNotificationPreferenceRecord =
	typeof userNotificationPreferences.$inferSelect;
export type NotificationChannelOverrideRecord =
	typeof notificationChannelOverrides.$inferSelect;
