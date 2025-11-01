import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("dashboard-backend");

// Authentication Metrics
export const authMetrics = {
	loginAttempts: meter.createCounter("auth_login_attempts_total", {
		description: "Total number of login attempts",
	}),
	loginSuccesses: meter.createCounter("auth_login_success_total", {
		description: "Total number of successful logins",
	}),
	loginFailures: meter.createCounter("auth_login_failures_total", {
		description: "Total number of failed logins",
	}),
	activeUsers: meter.createUpDownCounter("auth_active_users", {
		description: "Number of currently active users",
	}),
};

// User Metrics
export const userMetrics = {
	userCreations: meter.createCounter("user_creations_total", {
		description: "Total number of user accounts created",
	}),
	userDeletions: meter.createCounter("user_deletions_total", {
		description: "Total number of user accounts deleted",
	}),
};

// Permission Metrics
export const permissionMetrics = {
	permissionDenials: meter.createCounter("permission_denials_total", {
		description: "Total number of permission denials",
	}),
};

// Job Queue Metrics
export const jobMetrics = {
	jobsEnqueued: meter.createCounter("jobs_enqueued_total", {
		description: "Total number of jobs enqueued",
	}),
	jobsCompleted: meter.createCounter("jobs_completed_total", {
		description: "Total number of jobs completed",
	}),
	jobsFailed: meter.createCounter("jobs_failed_total", {
		description: "Total number of jobs failed",
	}),
	jobDuration: meter.createHistogram("job_duration_ms", {
		description: "Job execution duration in milliseconds",
	}),
};

// Database Metrics
export const dbMetrics = {
	queryDuration: meter.createHistogram("db_query_duration_ms", {
		description: "Database query duration in milliseconds",
	}),
};

// API Metrics (supplementary to auto-instrumentation)
export const apiMetrics = {
	errorsByType: meter.createCounter("api_errors_by_type_total", {
		description: "Total API errors grouped by error type",
	}),
};
