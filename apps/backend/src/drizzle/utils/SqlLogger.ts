import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import type { Logger } from "drizzle-orm/logger";
import appEnv from "../../appEnv";
import appLogger from "../../utils/logger";

class SqlLogger implements Logger {
	logQuery(query: string, params: unknown[]) {
		// Log the SQL query
		appLogger.sql(query, params);

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

					// Create a child span for this database query
					const span = tracer.startSpan(
						spanName,
						{},
						context.active(),
					);

					// Set span attributes
					span.setAttribute("db.system", "postgresql");
					span.setAttribute("db.operation", operation);
					span.setAttribute("db.sql.table", tableName);
					span.setAttribute("db.statement", query);

					// Add parameters as JSON (be careful with sensitive data)
					if (params && params.length > 0) {
						span.setAttribute(
							"db.statement.parameters",
							JSON.stringify(params),
						);
					}

					// Mark span as successful
					span.setStatus({ code: SpanStatusCode.OK });

					// End the span immediately since this is a synchronous log
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
