import { createId } from "@paralleldrive/cuid2";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import appEnv from "../appEnv";
import type HonoEnv from "../types/HonoEnv";
import appLogger from "../utils/logger";
import {
	shouldRecordRequest,
	extractHeaders,
	getClientIp,
} from "../utils/observability-utils";
import {
	storeObservabilityEvent,
	storeRequestDetails,
	extractRequestBody,
	extractResponseBody,
	type ObservabilityEventData,
	type RequestDetailsData,
} from "../services/observability-service";

/**
 * Enhanced middleware for logging requests and storing observability data.
 *
 * This middleware extends the original request logger to include:
 * - Observability event tracking
 * - Request/response detail storage
 * - Performance metrics collection
 * - Configurable data masking and storage controls
 *
 * The middleware respects all observability configuration settings and
 * will gracefully degrade if observability is disabled.
 *
 * @param c - The context object which contains request/response and environment information
 * @param next - The next middleware function in the stack to be called
 * @returns A promise that resolves when the middleware processing is complete
 */
const enhancedRequestLogger = createMiddleware<HonoEnv>(async (c, next) => {
	// Generate unique request ID for correlation
	const requestId = createId();
	c.set("requestId", requestId);

	const shouldRecord = shouldRecordRequest(c.req.path, c.req.method);
	const shouldLog = appEnv.LOG_REQUEST;

	// If neither logging nor observability is enabled, just pass through
	if (!shouldLog && !shouldRecord) {
		await next();
		return;
	}

	const startTime = performance.now();

	// Capture request data for observability
	let requestBody: unknown = null;
	let originalRequest: Request | null = null;

	if (shouldRecord || shouldLog) {
		// Clone the request to preserve the body for both logging and observability
		originalRequest = c.req.raw.clone();

		// Extract request body if needed for observability
		if (
			shouldRecord &&
			(appEnv.OBSERVABILITY_STORE_REQUEST_BODIES || shouldLog)
		) {
			try {
				requestBody = await extractRequestBody(c);
			} catch {
				// Ignore body extraction errors
				requestBody = null;
			}
		}
	}

	await next();

	const endTime = performance.now();
	const responseTime = Math.floor(endTime - startTime);

	// Handle original request logging
	if (shouldLog && originalRequest) {
		const originalReq = c.req.raw;
		c.req.raw = originalRequest;
		appLogger.request(c, responseTime);
		c.req.raw = originalReq;
	}

	// Handle observability data collection
	if (shouldRecord && appEnv.OBSERVABILITY_ENABLED) {
		// Don't await these operations to avoid blocking the response
		Promise.all([
			storeObservabilityEventAsync(c, requestId, responseTime),
			storeRequestDetailsAsync(c, requestId, requestBody),
		]).catch((error) => {
			// Log but don't throw to avoid disrupting the response
			console.error("Failed to store observability data:", error);
		});
	}
});

/**
 * Stores observability event data asynchronously
 * @param c - Hono context
 * @param requestId - Unique request identifier
 * @param responseTime - Response time in milliseconds
 */
async function storeObservabilityEventAsync(
	c: Context<HonoEnv>,
	requestId: string,
	responseTime: number,
): Promise<void> {
	try {
		const eventData: ObservabilityEventData = {
			eventType: "api_request",
			requestId,
			userId: c.var.uid || null,
			endpoint: c.req.path,
			method: c.req.method,
			statusCode: c.res.status,
			responseTimeMs: responseTime,
			metadata: {
				userAgent: c.req.header("user-agent"),
				contentType: c.req.header("content-type"),
				responseContentType: c.res.headers.get("content-type"),
				queryParams: Object.fromEntries(
					new URL(c.req.url).searchParams.entries(),
				),
			},
		};

		await storeObservabilityEvent(eventData);
	} catch (error) {
		console.error("Failed to store observability event:", error);
	}
}

/**
 * Stores request details data asynchronously
 * @param c - Hono context
 * @param requestId - Unique request identifier
 * @param requestBody - Extracted request body
 */
async function storeRequestDetailsAsync(
	c: Context<HonoEnv>,
	requestId: string,
	requestBody: unknown,
): Promise<void> {
	try {
		// Extract response body if configured
		let responseBody: unknown = null;
		if (appEnv.OBSERVABILITY_STORE_RESPONSE_BODIES) {
			responseBody = await extractResponseBody(c.res);
		}

		const detailsData: RequestDetailsData = {
			requestId,
			userId: c.var.uid || null,
			method: c.req.method,
			endpoint: c.req.path,
			queryParams: Object.fromEntries(
				new URL(c.req.url).searchParams.entries(),
			),
			requestBody,
			responseBody,
			requestHeaders: extractHeaders(c.req.raw.headers, true),
			responseHeaders: extractHeaders(c.res.headers, false),
			ipAddress: getClientIp(c.req.raw.headers),
			userAgent: c.req.header("user-agent"),
		};

		await storeRequestDetails(detailsData);
	} catch (error) {
		console.error("Failed to store request details:", error);
	}
}

export default enhancedRequestLogger;
