import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { moneyAccounts } from "./moneyAccounts";
import { moneyBudgets } from "./moneyBudgets";
import { moneyCategories } from "./moneyCategories";
import { moneySavings } from "./moneySavings";
import { moneyTransactions } from "./moneyTransactions";
import { oauthGoogle } from "./oauthGoogle";
import { oauthMicrosoft } from "./oauthMicrosoft";
import { permissionsToUsers } from "./permissionsToUsers";
import { refreshTokens } from "./refreshTokens";
import { rolesToUsers } from "./rolesToUsers";
import { ujian } from "./ujian";
import { ujianAttempts } from "./ujianAttempts";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: varchar("name", { length: 255 }).notNull(),
	username: varchar("username").notNull().unique(),
	email: varchar("email"),
	phoneNumber: varchar("phone_number", { length: 20 }),
	password: text("password"),
	isEnabled: boolean("is_enable").default(true),
	themeMode: varchar("theme_mode", { length: 20 }).default("light"),
	colorScheme: varchar("color_scheme", { length: 20 }).default("default"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const usersRelations = relations(users, ({ many, one }) => ({
	permissionsToUsers: many(permissionsToUsers),
	rolesToUsers: many(rolesToUsers),
	oauthGoogle: one(oauthGoogle, {
		fields: [users.id],
		references: [oauthGoogle.userId],
	}),
	oauthMicrosoft: one(oauthMicrosoft, {
		fields: [users.id],
		references: [oauthMicrosoft.userId],
	}),
	refreshTokens: many(refreshTokens),
	createdUjian: many(ujian),
	ujianAttempts: many(ujianAttempts),
	moneyAccounts: many(moneyAccounts),
	moneyCategories: many(moneyCategories),
	moneyTransactions: many(moneyTransactions),
	moneySavings: many(moneySavings),
	moneyBudgets: many(moneyBudgets),
}));
