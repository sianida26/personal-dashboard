import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import appEnv from "../appEnv";

/**
 * Wraps a database transaction with an OpenTelemetry span
 *
 * @param spanName - Name of the span (e.g., "create_notification", "update_user")
 * @param operation - The database operation to execute
 * @param attributes - Additional attributes to add to the span
 * @returns The result of the operation
 */
export async function withDbSpan<T>(
	spanName: string,
	operation: () => Promise<T>,
	attributes?: Record<string, string | number | boolean>,
): Promise<T> {
	if (!appEnv.OTEL_ENABLED) {
		// If tracing is disabled, just execute the operation
		return operation();
	}

	const tracer = trace.getTracer(appEnv.OTEL_SERVICE_NAME);
	const span = tracer.startSpan(`db.${spanName}`, {}, context.active());

	try {
		// Set default attributes
		span.setAttribute("db.system", "postgresql");
		span.setAttribute("db.operation.name", spanName);

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
}

/**
 * Wraps a database transaction with an OpenTelemetry span
 * This is specifically for Drizzle transaction callbacks
 *
 * @param spanName - Name of the transaction span
 * @param transactionFn - The transaction function from Drizzle
 * @param attributes - Additional attributes to add to the span
 * @returns The result of the transaction
 */
export async function withDbTransaction<T>(
	spanName: string,
	transactionFn: () => Promise<T>,
	attributes?: Record<string, string | number | boolean>,
): Promise<T> {
	return withDbSpan(`transaction.${spanName}`, transactionFn, {
		"db.operation.type": "transaction",
		...attributes,
	});
}
