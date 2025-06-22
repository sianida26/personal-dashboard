import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

/**
 * Dashboards table - Custom dashboards for each project
 * Allows users to create custom views and analytics per project
 */
export const dashboards = pgTable("dashboards", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	config: jsonb("config").notNull(), // Dashboard configuration (widgets, layout, etc.)
	isDefault: boolean("is_default").default(false),
	createdBy: text("created_by")
		.references(() => users.id),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

/**
 * Dashboards relations
 */
export const dashboardsRelations = relations(dashboards, ({ one }) => ({
	project: one(projects, {
		fields: [dashboards.projectId],
		references: [projects.id],
	}),
	creator: one(users, {
		fields: [dashboards.createdBy],
		references: [users.id],
	}),
}));
