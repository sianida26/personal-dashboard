import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	varchar,
	unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

/**
 * Project members table - Many-to-many relationship between users and projects
 * Defines which users have access to which projects and their roles
 */
export const projectMembers = pgTable("project_members", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	role: varchar("role", { length: 20 }).notNull(), // owner, admin, member, viewer
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
}, (table) => ({
	// Ensure a user can only have one role per project
	uniqueProjectUser: unique().on(table.projectId, table.userId),
}));

/**
 * Project members relations
 */
export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
	user: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
	}),
}));
