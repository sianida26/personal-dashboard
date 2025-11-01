import { SpanStatusCode, trace } from "@opentelemetry/api";
import type { Context } from "hono";
import { apiMetrics } from "./custom-metrics";

/**
 * Records error details to OpenTelemetry traces
 * @param error - The error object to record
 * @param context - Optional Hono context for additional metadata
 */
export function recordError(error: Error, context?: Context) {
	const span = trace.getActiveSpan();

	if (span) {
		// Record exception on current span
		span.recordException(error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: error.message,
		});

		// Add context attributes
		if (context) {
			span.setAttribute("http.route", context.req.path);
			span.setAttribute("http.method", context.req.method);
			span.setAttribute("http.status_code", context.res.status);
			span.setAttribute("error.type", error.constructor.name);
		}
	}

	// Increment error counter
	apiMetrics.errorsByType.add(1, {
		error_type: error.constructor.name,
		route: context?.req.path || "unknown",
	});
}
