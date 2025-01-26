import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { permissionsToRoles } from "./permissionsToRoles";
import { permissionsToUsers } from "./permissionsToUsers";

export const permissionsSchema = pgTable("permissions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	code: varchar("code", { length: 50 }).notNull().unique(),
	description: varchar("description", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissionsRelations = relations(
	permissionsSchema,
	({ many }) => ({
		permissionsToUsers: many(permissionsToUsers),
		permissionsToRoles: many(permissionsToRoles),
	}),
);
