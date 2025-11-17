import { trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import type { Context } from "hono";
import appEnv from "../appEnv";
import type HonoEnv from "../types/HonoEnv";

/**
 * Logger class for handling application logging with OpenTelemetry trace correlation
 *
 * This class provides logging methods that:
 * - Output to console for local development
 * - Send structured logs to OpenTelemetry collector (SigNoz)
 * - Include trace/span IDs for correlation with distributed traces
 */
class Logger {
	/**
	 * Initializes a new Logger instance
	 */
	constructor() {}

	/**
	 * Gets the current trace and span IDs from the active OpenTelemetry context
	 * @returns Object with traceId and spanId, or empty strings if not available
	 */
	private getTraceContext(): { traceId: string; spanId: string } {
		if (!appEnv.OTEL_ENABLED) {
			return { traceId: "", spanId: "" };
		}

		const span = trace.getActiveSpan();
		if (!span) {
			return { traceId: "", spanId: "" };
		}

		const spanContext = span.spanContext();
		return {
			traceId: spanContext.traceId,
			spanId: spanContext.spanId,
		};
	}

	/**
	 * Formats a log message with trace context
	 * @param level - Log level (ERROR, INFO, DEBUG, etc.)
	 * @param message - The log message
	 * @param c - Optional Hono context
	 * @returns Formatted log message
	 */
	private formatMessage(
		level: string,
		message: string,
		c?: Context<HonoEnv>,
	): string {
		const { traceId, spanId } = this.getTraceContext();
		const timestamp = new Date().toISOString();

		// Build context information if available
		let contextInfo = "";
		if (c) {
			const uid = c.var.uid ?? "-";
			const requestId = c.var.requestId ?? "-";
			const method = c.req.method;
			const path = c.req.path;
			contextInfo = `[${method} ${path}] [UID: ${uid}] [ReqID: ${requestId}] `;
		}

		// Add trace context if available
		const traceInfo =
			traceId && spanId
				? `[TraceID: ${traceId}] [SpanID: ${spanId}] `
				: "";

		return `[${timestamp}] [${level}] ${traceInfo}${contextInfo}${message}`;
	}

	/**
	 * Emits a structured log record to OpenTelemetry
	 * Uses logs.getLogger() directly - NodeSDK sets up the LoggerProvider automatically
	 * @param severityNumber - OpenTelemetry severity number
	 * @param severityText - Severity text (ERROR, INFO, etc.)
	 * @param body - Log message body
	 * @param c - Optional Hono context
	 */
	private emitOtelLog(
		severityNumber: SeverityNumber,
		severityText: string,
		body: string,
		c?: Context<HonoEnv>,
	): void {
		if (!appEnv.OTEL_ENABLED) return;

		// Build attributes from context
		const attributes: Record<string, string | number> = {
			"log.level": severityText,
		};

		if (c) {
			attributes["http.method"] = c.req.method;
			attributes["http.path"] = c.req.path;
			attributes["http.url"] = c.req.url;
			if (c.var.uid) attributes["user.id"] = c.var.uid;
			if (c.var.requestId) attributes["request.id"] = c.var.requestId;
			if (c.var.currentUser?.name)
				attributes["user.name"] = c.var.currentUser.name;
			if (c.var.currentUser?.email)
				attributes["user.email"] = c.var.currentUser.email;
		}

		// Get logger directly from logs API (NodeSDK handles the provider setup)
		logs.getLogger(appEnv.OTEL_SERVICE_NAME || "dashboard-backend").emit({
			severityNumber,
			severityText,
			body,
			attributes,
		});
	}

	/**
	 * Logs an error with appropriate formatting based on error type
	 *
	 * @param error - The error object to log
	 * @param c - Optional Hono context containing request information
	 */
	error(error: Error, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_ERROR) return;

		const message = `${error.name}: ${error.message}`;

		// Log to console for development
		console.error(this.formatMessage("ERROR", message, c));
		if (error.stack) {
			console.error(error.stack);
		}

		// Send to OpenTelemetry
		this.emitOtelLog(
			SeverityNumber.ERROR,
			"ERROR",
			error.stack || message,
			c,
		);
	}

	/**
	 * Logs an informational message
	 *
	 * @param message - The information message to log
	 * @param c - Optional Hono context containing request information
	 */
	info(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_INFO) return;

		// Log to console for development
		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(this.formatMessage("INFO", message, c));

		// Send to OpenTelemetry
		this.emitOtelLog(SeverityNumber.INFO, "INFO", message, c);
	}

	/**
	 * Logs a debug message
	 *
	 * @param message - The debug message to log
	 * @param c - Optional Hono context containing request information
	 */
	debug(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_DEBUG) return;

		// Log to console for development
		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(this.formatMessage("DEBUG", message, c));

		// Send to OpenTelemetry
		this.emitOtelLog(SeverityNumber.DEBUG, "DEBUG", message, c);
	}

	/**
	 * Logs an HTTP request with response information
	 *
	 * @param c - Hono context containing request and response information
	 * @param responseTime - Optional response time in milliseconds
	 */
	request(c: Context<HonoEnv>, responseTime?: number) {
		if (!appEnv.LOG_REQUEST) return;

		// Get request body and query as strings, handle potential JSON parsing errors
		let bodyStr = "-";
		let queryStr = "-";

		try {
			const body = c.req.raw.body;
			if (body) {
				bodyStr = JSON.stringify(body);
			}
		} catch (_) {
			bodyStr = "[unparseable body]";
		}

		try {
			const url = new URL(c.req.url);
			if (url.search) {
				queryStr = url.search;
			}
		} catch (_) {
			queryStr = "[unparseable query]";
		}

		const message = `${c.req.method} ${c.req.path} ${c.var.uid ?? "-"} ${
			c.var.requestId ?? "-"
		} ${c.res.status} ${responseTime ?? "-"}ms ${
			c.req.header("User-Agent") ?? "-"
		}\nQUERY:${queryStr}\nBODY:${bodyStr}\n`;

		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(`REQ: ${message}`);
	}

	/**
	 * Logs an SQL query with its parameters
	 *
	 * @param query - The SQL query string
	 * @param params - The parameters used in the query
	 */
	sql(query: string, params: unknown[]) {
		if (!appEnv.LOG_SQL) return;

		const message = `${query} ${JSON.stringify(params)}`;

		// Log to console for development
		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(this.formatMessage("SQL", message));

		// Send to OpenTelemetry (as DEBUG level)
		this.emitOtelLog(SeverityNumber.DEBUG, "SQL", message);
	}
}

/**
 * Singleton instance of the Logger class for application-wide use
 */
const appLogger = new Logger();

export default appLogger;
