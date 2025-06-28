import type { Context } from "hono";
import type HonoEnv from "../types/HonoEnv";
import { createId } from "@paralleldrive/cuid2";
import { routePath } from "hono/route";
import appEnv from "../appEnv";
import DashboardError from "../errors/DashboardError";
import {
	storeObservabilityEvent,
	type ObservabilityEventData,
} from "./observability-service";

/**
 * Records backend errors as observability events for monitoring and debugging
 * @param error - The error that occurred
 * @param context - The Hono context
 */
export async function recordBackendError(
	error: Error,
	context: Context<HonoEnv>,
): Promise<void> {
	try {
		// Check if observability is enabled
		if (!appEnv.OBSERVABILITY_ENABLED) {
			return;
		}

		// Get or generate request ID
		let requestId = context.get("requestId");
		if (!requestId) {
			requestId = createId();
		}

		// Determine if this error should be recorded based on status code
		let statusCode = 500; // Default for unhandled errors
		let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "CRITICAL";
		let errorCode = "INTERNAL_SERVER_ERROR";

		if (error instanceof DashboardError) {
			statusCode = error.statusCode;
			severity = error.severity;
			errorCode = error.errorCode;
		}

		// Check if this status code should be recorded
		if (!appEnv.OBSERVABILITY_ERROR_STATUS_CODES.includes(statusCode)) {
			return;
		}

		// Extract stack trace
		const stackTrace = error.stack || "";

		// Create observability event data
		const eventData: ObservabilityEventData = {
			eventType: "api_request", // Backend errors are still API request events but with error status
			requestId,
			userId: context.var.uid || null,
			endpoint: context.req.path,
			routePath: routePath(context),
			method: context.req.method,
			statusCode,
			errorMessage: error.message,
			stackTrace,
			metadata: {
				errorCode,
				severity,
				userAgent: context.req.header("user-agent"),
				contentType: context.req.header("content-type"),
				errorType: error.constructor.name,
				timestamp: new Date().toISOString(),
				queryParams: Object.fromEntries(
					new URL(context.req.url).searchParams.entries(),
				),
			},
		};

		// Store the error event asynchronously to avoid blocking the response
		await storeObservabilityEvent(eventData);
	} catch (recordingError) {
		// Log the recording error but don't throw to avoid disrupting error handling
		console.error("Failed to record backend error:", recordingError);
	}
}

/**
 * Determines the criticality/severity based on status code
 * @param statusCode - HTTP status code
 * @returns The severity level
 */
export function getErrorSeverity(
	statusCode: number,
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
	if (statusCode >= 500) {
		return "CRITICAL"; // Server errors are critical
	}
	if (statusCode === 422) {
		return "MEDIUM"; // Validation errors are medium severity
	}
	if (statusCode >= 400) {
		return "LOW"; // Client errors are typically low severity
	}
	return "MEDIUM"; // Default fallback
}
