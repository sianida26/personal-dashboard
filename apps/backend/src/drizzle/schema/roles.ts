import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { permissionsToRoles } from "./permissionsToRoles";

export const rolesSchema = pgTable("roles", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	code: varchar("code", { length: 50 }).notNull().unique(),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const rolesRelations = relations(rolesSchema, ({ many }) => ({
	permissionsToRoles: many(permissionsToRoles),
}));
