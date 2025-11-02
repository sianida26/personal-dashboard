import type { Context } from "hono";
import appEnv from "../appEnv";
import type HonoEnv from "../types/HonoEnv";

/**
 * Logger class for handling application logging
 *
 * This class provides logging methods that output to console.
 */
class Logger {
	/**
	 * Initializes a new Logger instance
	 */
	constructor() {}

	/**
	 * Logs an error with appropriate formatting based on error type
	 *
	 * @param error - The error object to log
	 * @param c - Optional Hono context containing request information
	 */
	error(error: Error, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_ERROR) return;

		// Build context information if available
		let contextInfo = "";
		if (c) {
			const uid = c.var.uid ?? "-";
			const requestId = c.var.requestId ?? "-";
			const method = c.req.method;
			const path = c.req.path;
			contextInfo = `[${method} ${path}] [UID: ${uid}] [ReqID: ${requestId}] `;
		}

		console.error(`${contextInfo}${error.name}: ${error.message}`);
		if (error.stack) {
			console.error(error.stack);
		}
	}

	/**
	 * Logs an informational message
	 *
	 * @param message - The information message to log
	 * @param c - Optional Hono context containing request information
	 */
	info(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_INFO) return;

		// Build context information if available
		let contextInfo = "";
		if (c) {
			const uid = c.var.uid ?? "-";
			const requestId = c.var.requestId ?? "-";
			const method = c.req.method;
			const path = c.req.path;
			contextInfo = `[${method} ${path}] [UID: ${uid}] [ReqID: ${requestId}] `;
		}

		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(`INFO: ${contextInfo}${message}`);
	}

	/**
	 * Logs a debug message
	 *
	 * @param message - The debug message to log
	 * @param c - Optional Hono context containing request information
	 */
	debug(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_DEBUG) return;

		// Build context information if available
		let contextInfo = "";
		if (c) {
			const uid = c.var.uid ?? "-";
			const requestId = c.var.requestId ?? "-";
			const method = c.req.method;
			const path = c.req.path;
			contextInfo = `[${method} ${path}] [UID: ${uid}] [ReqID: ${requestId}] `;
		}

		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(`DEBUG: ${contextInfo}${message}`);
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
		
		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(`SQL: ${query} ${JSON.stringify(params)}`);
	}
}

/**
 * Singleton instance of the Logger class for application-wide use
 */
const appLogger = new Logger();

export default appLogger;
