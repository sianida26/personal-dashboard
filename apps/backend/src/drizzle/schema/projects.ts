import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	varchar,
	integer,
} from "drizzle-orm/pg-core";

/**
 * Projects table - Contains all observability projects
 * Each project represents a separate application/service being monitored
 */
export const projects = pgTable("projects", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull().unique(),
	description: text("description"),
	apiKey: varchar("api_key", { length: 64 }).notNull().unique(),
	status: varchar("status", { length: 20 }).notNull().default("active"), // active, suspended, archived
	retentionDays: integer("retention_days").notNull().default(30),
	maxSpansPerHour: integer("max_spans_per_hour").default(100000),
	maxMetricsPerHour: integer("max_metrics_per_hour").default(50000),
	maxLogsPerHour: integer("max_logs_per_hour").default(200000),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

/**
 * Projects relations - Define relationships to other tables
 * Relations will be populated after all schemas are loaded
 */
export const projectsRelations = relations(projects, ({ many }) => ({
	// Empty for now to avoid circular imports
	// Relations will be defined in the drizzle index.ts or separate file
}));
