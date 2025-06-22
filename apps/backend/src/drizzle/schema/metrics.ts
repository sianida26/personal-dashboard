import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	decimal,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * Metrics table - OpenTelemetry metrics with project isolation
 * Stores application metrics for each project
 */
export const metrics = pgTable("metrics", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	metricName: varchar("metric_name", { length: 255 }).notNull(),
	metricType: varchar("metric_type", { length: 20 }).notNull(), // counter, gauge, histogram, summary
	metricValue: decimal("metric_value").notNull(),
	timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
	serviceName: varchar("service_name", { length: 100 }).notNull(),
	serviceVersion: varchar("service_version", { length: 50 }),
	attributes: jsonb("attributes"), // OpenTelemetry attributes
	resourceAttributes: jsonb("resource_attributes"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => ({
	// Performance indexes for time-series queries
	projectTimeIdx: index("metrics_project_time_idx").on(table.projectId, table.timestamp),
	metricNameIdx: index("metrics_name_idx").on(table.metricName),
	serviceNameIdx: index("metrics_service_name_idx").on(table.serviceName),
	projectMetricIdx: index("metrics_project_metric_idx").on(table.projectId, table.metricName),
}));

/**
 * Metrics relations
 */
export const metricsRelations = relations(metrics, ({ one }) => ({
	project: one(projects, {
		fields: [metrics.projectId],
		references: [projects.id],
	}),
}));
