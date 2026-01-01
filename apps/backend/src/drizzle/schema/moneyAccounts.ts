import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { moneyTransactions } from "./moneyTransactions";
import { users } from "./users";

export const accountTypeEnum = pgEnum("account_type", [
	"cash",
	"bank",
	"e_wallet",
	"credit_card",
	"investment",
]);

export const moneyAccounts = pgTable(
	"money_accounts",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		type: accountTypeEnum("type").notNull(),
		balance: numeric("balance", { precision: 15, scale: 2 })
			.notNull()
			.default("0"),
		currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
		icon: varchar("icon", { length: 50 }),
		color: varchar("color", { length: 7 }),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		userIdIdx: index("idx_money_accounts_user_id").on(table.userId),
		isActiveIdx: index("idx_money_accounts_is_active").on(table.isActive),
	}),
);

export const moneyAccountsRelations = relations(
	moneyAccounts,
	({ one, many }) => ({
		user: one(users, {
			fields: [moneyAccounts.userId],
			references: [users.id],
		}),
		transactions: many(moneyTransactions),
		transferTransactions: many(moneyTransactions, {
			relationName: "transferTo",
		}),
	}),
);
