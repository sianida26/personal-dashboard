import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const jobs = pgTable("jobs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	type: varchar("type", { length: 100 }).notNull(),
	priority: integer("priority").notNull().default(0),
	payload: json("payload").notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending"),
	scheduledAt: timestamp("scheduled_at", { mode: "date" }),
	startedAt: timestamp("started_at", { mode: "date" }),
	completedAt: timestamp("completed_at", { mode: "date" }),
	failedAt: timestamp("failed_at", { mode: "date" }),
	retryCount: integer("retry_count").notNull().default(0),
	maxRetries: integer("max_retries").notNull().default(3),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	createdBy: text("created_by"),
	workerId: varchar("worker_id", { length: 50 }),
	timeoutSeconds: integer("timeout_seconds").default(300),
	tags: json("tags").default([]),
});

export const jobExecutions = pgTable("job_executions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	jobId: text("job_id")
		.notNull()
		.references(() => jobs.id, { onDelete: "cascade" }),
	attemptNumber: integer("attempt_number").notNull(),
	status: varchar("status", { length: 20 }).notNull(),
	startedAt: timestamp("started_at", { mode: "date" }).notNull(),
	completedAt: timestamp("completed_at", { mode: "date" }),
	errorMessage: text("error_message"),
	workerId: varchar("worker_id", { length: 50 }),
	executionTimeMs: integer("execution_time_ms"),
	memoryUsageMb: integer("memory_usage_mb"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const jobSchedules = pgTable("job_schedules", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: varchar("name", { length: 100 }).notNull().unique(),
	jobType: varchar("job_type", { length: 100 }).notNull(),
	cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
	payload: json("payload").notNull().default({}),
	isActive: boolean("is_active").notNull().default(true),
	timezone: varchar("timezone", { length: 50 }).default("UTC"),
	lastRunAt: timestamp("last_run_at", { mode: "date" }),
	nextRunAt: timestamp("next_run_at", { mode: "date" }),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	createdBy: text("created_by"),
});

export const jobsRelations = relations(jobs, ({ many, one }) => ({
	jobExecutions: many(jobExecutions),
	createdByUser: one(users, {
		fields: [jobs.createdBy],
		references: [users.id],
	}),
}));

export const jobExecutionsRelations = relations(jobExecutions, ({ one }) => ({
	job: one(jobs, {
		fields: [jobExecutions.jobId],
		references: [jobs.id],
	}),
}));

export const jobSchedulesRelations = relations(jobSchedules, ({ one }) => ({
	createdByUser: one(users, {
		fields: [jobSchedules.createdBy],
		references: [users.id],
	}),
}));
