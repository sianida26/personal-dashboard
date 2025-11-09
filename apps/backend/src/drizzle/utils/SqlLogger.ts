import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import type { Logger } from "drizzle-orm/logger";
import appEnv from "../../appEnv";
import { dbMetrics } from "../../utils/custom-metrics";
import appLogger from "../../utils/logger";

/**
 * Custom SQL logger for Drizzle ORM that integrates with OpenTelemetry
 *
 * This logger:
 * - Logs SQL queries to console (if LOG_SQL is enabled)
 * - Creates OpenTelemetry spans for each database query
 * - Records database query duration as metrics
 * - Enriches spans with query details (operation, table, parameters)
 */
class SqlLogger implements Logger {
	logQuery(query: string, params: unknown[]) {
		// Skip logging for job queue polling queries to reduce noise
		// These queries run frequently (every poll interval) when workers check for pending jobs
		const isJobQueuePollQuery =
			query.includes('from "jobs"') &&
			query.includes('where ("jobs"."status" = $1') &&
			query.includes("for update skip locked");

		// Log the SQL query (skip if it's a job queue poll query)
		if (!isJobQueuePollQuery) {
			appLogger.sql(query, params);
		}

		// Create OpenTelemetry span for the database query if enabled
		if (appEnv.OTEL_ENABLED) {
			const tracer = trace.getTracer(appEnv.OTEL_SERVICE_NAME);
			const activeSpan = trace.getActiveSpan();

			if (activeSpan) {
				try {
					// Extract operation type from query (SELECT, INSERT, UPDATE, DELETE, etc.)
					const operation =
						query.trim().split(/\s+/)[0]?.toUpperCase() || "QUERY";

					// Extract table name if possible
					const tableMatch = query.match(
						/(?:FROM|INTO|UPDATE)\s+["']?(\w+)["']?/i,
					);
					const tableName = tableMatch?.[1] || "unknown";

					// Create span name as "DB: OPERATION table" (e.g., "DB: SELECT users", "DB: UPDATE notifications")
					const spanName = `DB: ${operation} ${tableName}`;

					// Track start time for duration metric
					const startTime = performance.now();

					// Create a child span for this database query
					const span = tracer.startSpan(
						spanName,
						{},
						context.active(),
					);

					// Set span attributes (OpenTelemetry semantic conventions for databases)
					span.setAttribute("db.system", "postgresql");
					span.setAttribute("db.operation", operation);
					span.setAttribute("db.sql.table", tableName);
					span.setAttribute("db.statement", query);
					span.setAttribute(
						"db.name",
						process.env.DATABASE_NAME || "unknown",
					);

					// Add parameters as JSON (be careful with sensitive data)
					if (params && params.length > 0) {
						// Sanitize parameters to avoid logging passwords, tokens, etc.
						const sanitizedParams = params.map((param) => {
							if (
								typeof param === "string" &&
								param.length > 100
							) {
								return `${param.substring(0, 100)}... (truncated)`;
							}
							return param;
						});
						span.setAttribute(
							"db.statement.parameters",
							JSON.stringify(sanitizedParams),
						);
						span.setAttribute(
							"db.statement.parameter_count",
							params.length,
						);
					}

					// Calculate duration
					const duration = performance.now() - startTime;

					// Record duration as span attribute
					span.setAttribute("db.query.duration_ms", duration);

					// Record duration as metric
					dbMetrics.queryDuration.record(duration, {
						operation,
						table: tableName,
					});

					// Mark span as successful
					span.setStatus({ code: SpanStatusCode.OK });

					// End the span
					span.end();
				} catch (error) {
					// If there's an error, just log it but don't fail the query
					console.error("Error creating span for SQL query:", error);
				}
			}
		}
	}
}

export default SqlLogger;
