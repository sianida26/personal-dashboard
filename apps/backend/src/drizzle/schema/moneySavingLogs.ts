import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	date,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { moneySavings } from "./moneySavings";

export const savingLogTypeEnum = pgEnum("saving_log_type", ["add", "withdraw"]);

export const moneySavingLogs = pgTable(
	"money_saving_logs",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		savingId: text("saving_id")
			.notNull()
			.references(() => moneySavings.id, { onDelete: "cascade" }),
		amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
		type: savingLogTypeEnum("type").notNull(),
		note: text("note"),
		date: date("date", { mode: "date" }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		savingIdIdx: index("idx_money_saving_logs_saving_id").on(
			table.savingId,
		),
		dateIdx: index("idx_money_saving_logs_date").on(table.date),
	}),
);

export const moneySavingLogsRelations = relations(
	moneySavingLogs,
	({ one }) => ({
		saving: one(moneySavings, {
			fields: [moneySavingLogs.savingId],
			references: [moneySavings.id],
		}),
	}),
);
