import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { moneyAccounts } from "./moneyAccounts";
import { moneyCategories } from "./moneyCategories";
import { users } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", [
	"income",
	"expense",
	"transfer",
]);

export const transactionSourceEnum = pgEnum("transaction_source", [
	"manual",
	"import",
]);

export const moneyTransactions = pgTable(
	"money_transactions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: text("account_id")
			.notNull()
			.references(() => moneyAccounts.id, { onDelete: "cascade" }),
		categoryId: text("category_id").references(() => moneyCategories.id, {
			onDelete: "set null",
		}),
		type: transactionTypeEnum("type").notNull(),
		amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
		description: text("description"),
		date: timestamp("date", { mode: "date" }).notNull(),
		toAccountId: text("to_account_id").references(() => moneyAccounts.id, {
			onDelete: "set null",
		}),
		source: transactionSourceEnum("source").notNull().default("manual"),
		tags: jsonb("tags").$type<string[]>(),
		labels: jsonb("labels").$type<string[]>(),
		attachmentUrl: text("attachment_url"),
		waMessageId: text("wa_message_id"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		userIdIdx: index("idx_money_transactions_user_id").on(table.userId),
		accountIdIdx: index("idx_money_transactions_account_id").on(
			table.accountId,
		),
		categoryIdIdx: index("idx_money_transactions_category_id").on(
			table.categoryId,
		),
		typeIdx: index("idx_money_transactions_type").on(table.type),
		dateIdx: index("idx_money_transactions_date").on(table.date),
		toAccountIdIdx: index("idx_money_transactions_to_account_id").on(
			table.toAccountId,
		),
	}),
);

export const moneyTransactionsRelations = relations(
	moneyTransactions,
	({ one }) => ({
		user: one(users, {
			fields: [moneyTransactions.userId],
			references: [users.id],
		}),
		account: one(moneyAccounts, {
			fields: [moneyTransactions.accountId],
			references: [moneyAccounts.id],
		}),
		category: one(moneyCategories, {
			fields: [moneyTransactions.categoryId],
			references: [moneyCategories.id],
		}),
		toAccount: one(moneyAccounts, {
			fields: [moneyTransactions.toAccountId],
			references: [moneyAccounts.id],
			relationName: "transferTo",
		}),
	}),
);
