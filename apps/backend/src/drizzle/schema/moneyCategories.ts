import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { moneyBudgets } from "./moneyBudgets";
import { moneyTransactions } from "./moneyTransactions";
import { users } from "./users";

export const categoryTypeEnum = pgEnum("category_type", ["income", "expense"]);

export const moneyCategories = pgTable(
	"money_categories",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		type: categoryTypeEnum("type").notNull(),
		icon: varchar("icon", { length: 50 }),
		color: varchar("color", { length: 7 }),
		parentId: text("parent_id"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		userIdIdx: index("idx_money_categories_user_id").on(table.userId),
		typeIdx: index("idx_money_categories_type").on(table.type),
		parentIdIdx: index("idx_money_categories_parent_id").on(table.parentId),
		isActiveIdx: index("idx_money_categories_is_active").on(table.isActive),
	}),
);

export const moneyCategoriesRelations = relations(
	moneyCategories,
	({ one, many }) => ({
		user: one(users, {
			fields: [moneyCategories.userId],
			references: [users.id],
		}),
		parent: one(moneyCategories, {
			fields: [moneyCategories.parentId],
			references: [moneyCategories.id],
			relationName: "subcategories",
		}),
		children: many(moneyCategories, {
			relationName: "subcategories",
		}),
		transactions: many(moneyTransactions),
		budgets: many(moneyBudgets),
	}),
);
