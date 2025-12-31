import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { moneySavingLogs } from "./moneySavingLogs";
import { users } from "./users";

export const moneySavings = pgTable(
	"money_savings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		targetAmount: numeric("target_amount", { precision: 15, scale: 2 })
			.notNull()
			.default("0"),
		currentAmount: numeric("current_amount", { precision: 15, scale: 2 })
			.notNull()
			.default("0"),
		targetDate: date("target_date", { mode: "date" }),
		icon: varchar("icon", { length: 50 }),
		color: varchar("color", { length: 7 }),
		isAchieved: boolean("is_achieved").notNull().default(false),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		userIdIdx: index("idx_money_savings_user_id").on(table.userId),
		isAchievedIdx: index("idx_money_savings_is_achieved").on(
			table.isAchieved,
		),
	}),
);

export const moneySavingsRelations = relations(
	moneySavings,
	({ one, many }) => ({
		user: one(users, {
			fields: [moneySavings.userId],
			references: [users.id],
		}),
		logs: many(moneySavingLogs),
	}),
);
