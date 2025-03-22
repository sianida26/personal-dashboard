import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { permissionsToUsers } from "./permissionsToUsers";
import { rolesToUsers } from "./rolesToUsers";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: varchar("name", { length: 255 }).notNull(),
	username: varchar("username").notNull().unique(),
	email: varchar("email"),
	password: text("password").notNull(),
	jobTitle: varchar("job_title", { length: 255 }),
	isEnabled: boolean("is_enable").default(true),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const microsoftUsers = pgTable("microsoft_users", {
	id: varchar("id", { length: 255 })
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id").references(() => users.id),
	microsoftId: varchar("microsoft_id", { length: 255 }).notNull(),
	accessToken: text("access_token").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
	permissionsToUsers: many(permissionsToUsers),
	rolesToUsers: many(rolesToUsers),
}));
