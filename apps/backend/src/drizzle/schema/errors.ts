import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * Errors table - Error tracking with project isolation
 * Derived from traces, logs, and custom error reporting
 */
export const errors = pgTable("errors", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	traceId: varchar("trace_id", { length: 32 }),
	spanId: varchar("span_id", { length: 16 }),
	title: varchar("title", { length: 255 }).notNull(),
	message: text("message"),
	stackTrace: text("stack_trace"),
	fingerprint: varchar("fingerprint", { length: 64 }), // For grouping similar errors
	level: varchar("level", { length: 20 }).default("error"),
	source: varchar("source", { length: 20 }), // frontend, backend, mobile
	serviceName: varchar("service_name", { length: 100 }),
	url: text("url"),
	userAgent: text("user_agent"),
	userId: varchar("user_id", { length: 100 }),
	sessionId: varchar("session_id", { length: 100 }),
	context: jsonb("context"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	resolvedAt: timestamp("resolved_at", { mode: "date" }),
	status: varchar("status", { length: 20 }).default("unresolved"), // unresolved, resolved, ignored
}, (table) => ({
	// Performance indexes for error tracking
	projectTimeIdx: index("errors_project_time_idx").on(table.projectId, table.createdAt),
	fingerprintIdx: index("errors_fingerprint_idx").on(table.fingerprint),
	statusIdx: index("errors_status_idx").on(table.status),
	levelIdx: index("errors_level_idx").on(table.level),
	projectStatusIdx: index("errors_project_status_idx").on(table.projectId, table.status),
	traceIdIdx: index("errors_trace_id_idx").on(table.traceId),
}));

/**
 * Errors relations
 */
export const errorsRelations = relations(errors, ({ one }) => ({
	project: one(projects, {
		fields: [errors.projectId],
		references: [projects.id],
	}),
}));
