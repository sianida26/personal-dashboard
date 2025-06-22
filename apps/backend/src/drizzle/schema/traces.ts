import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
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
 * Traces table - OpenTelemetry spans with project isolation
 * Stores distributed tracing data for each project
 */
export const traces = pgTable("traces", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	traceId: varchar("trace_id", { length: 32 }).notNull(),
	spanId: varchar("span_id", { length: 16 }).notNull(),
	parentSpanId: varchar("parent_span_id", { length: 16 }),
	operationName: varchar("operation_name", { length: 255 }).notNull(),
	startTime: timestamp("start_time", { mode: "date" }).notNull(),
	endTime: timestamp("end_time", { mode: "date" }),
	durationMs: integer("duration_ms"),
	statusCode: integer("status_code").default(0), // 0=unset, 1=ok, 2=error
	statusMessage: text("status_message"),
	serviceName: varchar("service_name", { length: 100 }).notNull(),
	serviceVersion: varchar("service_version", { length: 50 }),
	tags: jsonb("tags"), // OpenTelemetry attributes
	logs: jsonb("logs"), // OpenTelemetry events
	resourceAttributes: jsonb("resource_attributes"),
	isRoot: boolean("is_root").default(false),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => ({
	// Performance indexes for common queries
	projectTimeIdx: index("traces_project_time_idx").on(table.projectId, table.startTime),
	traceIdIdx: index("traces_trace_id_idx").on(table.traceId),
	serviceNameIdx: index("traces_service_name_idx").on(table.serviceName),
	statusCodeIdx: index("traces_status_code_idx").on(table.statusCode),
	projectServiceIdx: index("traces_project_service_idx").on(table.projectId, table.serviceName),
}));

/**
 * Traces relations
 */
export const tracesRelations = relations(traces, ({ one }) => ({
	project: one(projects, {
		fields: [traces.projectId],
		references: [projects.id],
	}),
}));
