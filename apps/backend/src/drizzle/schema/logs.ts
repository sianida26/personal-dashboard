import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * Logs table - OpenTelemetry logs with project isolation
 * Stores application logs for each project
 */
export const logs = pgTable("logs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	traceId: varchar("trace_id", { length: 32 }),
	spanId: varchar("span_id", { length: 16 }),
	timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
	severityText: varchar("severity_text", { length: 20 }), // TRACE, DEBUG, INFO, WARN, ERROR, FATAL
	severityNumber: integer("severity_number"),
	body: text("body"),
	serviceName: varchar("service_name", { length: 100 }).notNull(),
	serviceVersion: varchar("service_version", { length: 50 }),
	attributes: jsonb("attributes"),
	resourceAttributes: jsonb("resource_attributes"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => ({
	// Performance indexes for log queries
	projectTimeIdx: index("logs_project_time_idx").on(table.projectId, table.timestamp),
	severityIdx: index("logs_severity_idx").on(table.severityText),
	traceIdIdx: index("logs_trace_id_idx").on(table.traceId),
	serviceNameIdx: index("logs_service_name_idx").on(table.serviceName),
	projectServiceIdx: index("logs_project_service_idx").on(table.projectId, table.serviceName),
}));

/**
 * Logs relations
 */
export const logsRelations = relations(logs, ({ one }) => ({
	project: one(projects, {
		fields: [logs.projectId],
		references: [projects.id],
	}),
}));
