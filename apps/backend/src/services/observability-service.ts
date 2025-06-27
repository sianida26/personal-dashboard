import db from "../drizzle";
import { observabilityEvents } from "../drizzle/schema/observability-events";
import { requestDetails as requestDetailsTable } from "../drizzle/schema/request-details";
import appEnv from "../appEnv";
import {
	truncateData,
	sanitizeRequestData,
} from "../utils/observability-utils";
import type { Context } from "hono";
import type HonoEnv from "../types/HonoEnv";

/**
 * Interface for observability event data
 */
export interface ObservabilityEventData {
		eventType: "api_request" | "frontend_error" | "frontend_metric";
		requestId: string;
		userId?: string | null;
		endpoint: string;
		routePath?: string | null;
		method?: string;
		statusCode?: number;
		responseTimeMs?: number;
		errorMessage?: string;
		stackTrace?: string;
		metadata?: Record<string, unknown>;
	}

/**
 * Interface for request details data
 */
export interface RequestDetailsData {
		requestId: string;
		userId?: string | null;
		method: string;
		endpoint: string;
		routePath?: string | null;
		queryParams?: Record<string, unknown>;
		requestBody?: unknown;
		responseBody?: unknown;
		requestHeaders?: Record<string, string>;
		responseHeaders?: Record<string, string>;
		ipAddress?: string | null;
		userAgent?: string | null;
	}

/**
 * Stores an observability event in the database
 * @param eventData - The event data to store
 * @returns Promise that resolves when the event is stored
 */
export const storeObservabilityEvent = async (
	eventData: ObservabilityEventData,
): Promise<void> => {
	if (!appEnv.OBSERVABILITY_ENABLED) return;

	try {
		await db.insert(observabilityEvents).values({
			eventType: eventData.eventType,
			requestId: eventData.requestId,
			userId: appEnv.OBSERVABILITY_ANONYMIZE_USERS
				? null
				: eventData.userId,
			endpoint: eventData.endpoint,
			routePath: eventData.routePath,
			method: eventData.method,
			statusCode: eventData.statusCode,
			responseTimeMs: eventData.responseTimeMs,
			errorMessage: eventData.errorMessage,
			stackTrace: eventData.stackTrace,
			metadata: eventData.metadata,
		});
	} catch (error) {
		// Log error but don't throw to prevent disrupting the main request flow
		console.error("Failed to store observability event:", error);
	}
};

/**
 * Stores request details in the database
 * @param detailsData - The request details to store
 * @returns Promise that resolves when the details are stored
 */
export const storeRequestDetails = async (
	detailsData: RequestDetailsData,
): Promise<void> => {
	if (!appEnv.OBSERVABILITY_ENABLED) return;

	try {
		// Sanitize and truncate data based on configuration
		const processedData = {
			requestId: detailsData.requestId,
			userId: appEnv.OBSERVABILITY_ANONYMIZE_USERS
				? null
				: detailsData.userId,
			method: detailsData.method,
			endpoint: detailsData.endpoint,
			routePath: detailsData.routePath,
			queryParams: detailsData.queryParams
				? sanitizeRequestData(detailsData.queryParams)
				: null,
			requestBody: appEnv.OBSERVABILITY_STORE_REQUEST_BODIES
				? truncateData(sanitizeRequestData(detailsData.requestBody))
				: null,
			responseBody: appEnv.OBSERVABILITY_STORE_RESPONSE_BODIES
				? truncateData(sanitizeRequestData(detailsData.responseBody))
				: null,
			requestHeaders: detailsData.requestHeaders
				? sanitizeRequestData(detailsData.requestHeaders)
				: null,
			responseHeaders: detailsData.responseHeaders
				? sanitizeRequestData(detailsData.responseHeaders)
				: null,
			ipAddress: detailsData.ipAddress,
			userAgent: detailsData.userAgent,
		};

		await db.insert(requestDetailsTable).values(processedData);
	} catch (error) {
		// Log error but don't throw to prevent disrupting the main request flow
		console.error("Failed to store request details:", error);
	}
};

/**
 * Extracts request body safely
 * @param c - Hono context
 * @returns Promise that resolves to the request body or null
 */
export const extractRequestBody = async (
	c: Context<HonoEnv>,
): Promise<unknown> => {
	try {
		const contentType = c.req.header("content-type");

		if (!contentType) return null;

		if (contentType.includes("application/json")) {
			return await c.req.json();
		}

		if (contentType.includes("application/x-www-form-urlencoded")) {
			const formData = await c.req.formData();
			const result: Record<string, unknown> = {};
			for (const [key, value] of formData.entries()) {
				result[key] = value;
			}
			return result;
		}

		if (contentType.includes("text/")) {
			return await c.req.text();
		}

		// For other content types, return null to avoid parsing errors
		return null;
	} catch {
		// Return null if body extraction fails
		return null;
	}
};

/**
 * Extracts response body safely
 * @param response - Response object
 * @returns Promise that resolves to the response body or null
 */
export const extractResponseBody = async (
	response: Response,
): Promise<unknown> => {
	try {
		const contentType = response.headers.get("content-type");

		if (!contentType) return null;

		// Clone the response to avoid consuming the body
		const clonedResponse = response.clone();

		if (contentType.includes("application/json")) {
			return await clonedResponse.json();
		}

		if (contentType.includes("text/")) {
			return await clonedResponse.text();
		}

		// For other content types, return null
		return null;
	} catch {
		// Return null if body extraction fails
		return null;
	}
};
