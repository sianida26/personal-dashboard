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
	isEnabled: boolean("is_enable").default(true),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const usersRelations = relations(users, ({ many }) => ({
	permissionsToUsers: many(permissionsToUsers),
	rolesToUsers: many(rolesToUsers),
}));
