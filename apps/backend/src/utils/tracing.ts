import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import appEnv from "../appEnv";

/**
 * Utility for creating custom OpenTelemetry spans for business operations
 *
 * This provides a clean API for wrapping business logic with distributed tracing.
 */

/**
 * Wraps an async operation with an OpenTelemetry span
 *
 * @param spanName - Name of the span (e.g., "notification.send", "user.create")
 * @param operation - The async operation to execute
 * @param attributes - Optional attributes to add to the span
 * @returns The result of the operation
 *
 * @example
 * ```typescript
 * const result = await withSpan("notification.send", async () => {
 *   return await sendNotification(user, message);
 * }, {
 *   "notification.type": "email",
 *   "user.id": user.id
 * });
 * ```
 */
export async function withSpan<T>(
	spanName: string,
	operation: () => Promise<T>,
	attributes?: Record<string, string | number | boolean>,
): Promise<T> {
	if (!appEnv.OTEL_ENABLED) {
		// If tracing is disabled, just execute the operation
		return operation();
	}

	const tracer = trace.getTracer(appEnv.OTEL_SERVICE_NAME);

	// Create a new span in the current context
	return tracer.startActiveSpan(spanName, async (span) => {
		try {
			// Add custom attributes if provided
			if (attributes) {
				for (const [key, value] of Object.entries(attributes)) {
					span.setAttribute(key, value);
				}
			}

			// Execute the operation
			const result = await operation();

			// Mark span as successful
			span.setStatus({ code: SpanStatusCode.OK });

			return result;
		} catch (error) {
			// Record the exception and mark span as error
			span.recordException(error as Error);
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: (error as Error).message,
			});
			throw error;
		} finally {
			// Always end the span
			span.end();
		}
	});
}

/**
 * Wraps a synchronous operation with an OpenTelemetry span
 *
 * @param spanName - Name of the span
 * @param operation - The sync operation to execute
 * @param attributes - Optional attributes to add to the span
 * @returns The result of the operation
 *
 * @example
 * ```typescript
 * const result = withSyncSpan("validation.check", () => {
 *   return validateUserInput(data);
 * }, {
 *   "validation.type": "user_input"
 * });
 * ```
 */
export function withSyncSpan<T>(
	spanName: string,
	operation: () => T,
	attributes?: Record<string, string | number | boolean>,
): T {
	if (!appEnv.OTEL_ENABLED) {
		// If tracing is disabled, just execute the operation
		return operation();
	}

	const tracer = trace.getTracer(appEnv.OTEL_SERVICE_NAME);
	const span = tracer.startSpan(spanName, {}, context.active());

	try {
		// Add custom attributes if provided
		if (attributes) {
			for (const [key, value] of Object.entries(attributes)) {
				span.setAttribute(key, value);
			}
		}

		// Execute the operation
		const result = operation();

		// Mark span as successful
		span.setStatus({ code: SpanStatusCode.OK });

		return result;
	} catch (error) {
		// Record the exception and mark span as error
		span.recordException(error as Error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: (error as Error).message,
		});
		throw error;
	} finally {
		// Always end the span
		span.end();
	}
}

/**
 * Adds an event to the current active span
 *
 * @param eventName - Name of the event
 * @param attributes - Optional attributes for the event
 *
 * @example
 * ```typescript
 * addSpanEvent("email.queued", {
 *   "email.recipient": user.email,
 *   "email.template": "welcome"
 * });
 * ```
 */
export function addSpanEvent(
	eventName: string,
	attributes?: Record<string, string | number | boolean>,
): void {
	if (!appEnv.OTEL_ENABLED) return;

	const span = trace.getActiveSpan();
	if (span) {
		span.addEvent(eventName, attributes);
	}
}

/**
 * Adds attributes to the current active span
 *
 * @param attributes - Attributes to add
 *
 * @example
 * ```typescript
 * addSpanAttributes({
 *   "user.id": userId,
 *   "user.role": userRole
 * });
 * ```
 */
export function addSpanAttributes(
	attributes: Record<string, string | number | boolean>,
): void {
	if (!appEnv.OTEL_ENABLED) return;

	const span = trace.getActiveSpan();
	if (span) {
		for (const [key, value] of Object.entries(attributes)) {
			span.setAttribute(key, value);
		}
	}
}

/**
 * Gets the current trace ID (useful for correlation)
 *
 * @returns The trace ID or empty string if not available
 */
export function getCurrentTraceId(): string {
	if (!appEnv.OTEL_ENABLED) return "";

	const span = trace.getActiveSpan();
	if (!span) return "";

	return span.spanContext().traceId;
}

/**
 * Gets the current span ID (useful for correlation)
 *
 * @returns The span ID or empty string if not available
 */
export function getCurrentSpanId(): string {
	if (!appEnv.OTEL_ENABLED) return "";

	const span = trace.getActiveSpan();
	if (!span) return "";

	return span.spanContext().spanId;
}
