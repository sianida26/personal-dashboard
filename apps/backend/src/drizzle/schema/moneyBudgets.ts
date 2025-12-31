import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { moneyCategories } from "./moneyCategories";
import { users } from "./users";

export const budgetPeriodEnum = pgEnum("budget_period", [
	"daily",
	"weekly",
	"monthly",
	"yearly",
]);

export const moneyBudgets = pgTable(
	"money_budgets",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		categoryId: text("category_id").references(() => moneyCategories.id, {
			onDelete: "set null",
		}),
		amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
		period: budgetPeriodEnum("period").notNull(),
		startDate: date("start_date", { mode: "date" }).notNull(),
		endDate: date("end_date", { mode: "date" }).notNull(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		userIdIdx: index("idx_money_budgets_user_id").on(table.userId),
		categoryIdIdx: index("idx_money_budgets_category_id").on(
			table.categoryId,
		),
		periodIdx: index("idx_money_budgets_period").on(table.period),
		isActiveIdx: index("idx_money_budgets_is_active").on(table.isActive),
	}),
);

export const moneyBudgetsRelations = relations(moneyBudgets, ({ one }) => ({
	user: one(users, {
		fields: [moneyBudgets.userId],
		references: [users.id],
	}),
	category: one(moneyCategories, {
		fields: [moneyBudgets.categoryId],
		references: [moneyCategories.id],
	}),
}));
