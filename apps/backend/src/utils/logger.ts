import * as fs from "node:fs";
import dayjs from "dayjs";
import DayjsUTC from "dayjs/plugin/utc";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import appEnv from "../appEnv";
import DashboardError from "../errors/DashboardError";
import type HonoEnv from "../types/HonoEnv";

dayjs.extend(DayjsUTC);

/**
 * Types of logs supported by the Logger
 * - error: For error logs
 * - info: For informational logs
 * - debug: For debug logs
 * - request: For HTTP request logs
 * - sql: For SQL query logs
 */
type LOG_TYPES = "error" | "info" | "debug" | "request" | "sql";

/**
 * Logger class for handling application logging
 *
 * This class manages logging to different files based on log type and current date.
 * It dynamically creates log streams for each date, ensuring logs are written to
 * files corresponding to the date they occurred, not when the logger was initialized.
 */
class Logger {
	/**
	 * Dictionary of log streams indexed by date and then by log type
	 * Format: { "YYYYMMDD": { "error": WriteStream, "info": WriteStream, ... } }
	 */
	private logStreams: Record<string, Record<LOG_TYPES, fs.WriteStream>>;

	/**
	 * Initializes a new Logger instance with an empty streams dictionary
	 */
	constructor() {
		this.logStreams = {};
	}

	/**
	 * Gets or creates a log stream for the specified log type using the current date
	 *
	 * @param type - The type of log to get a stream for
	 * @returns A WriteStream for the specified log type on the current date
	 */
	private getLogStream(type: LOG_TYPES): fs.WriteStream {
		const currentDate = dayjs().utc().format("YYYYMMDD");
		const dateKey = currentDate;

		// Initialize streams for this date if they don't exist
		if (!this.logStreams[dateKey]) {
			this.logStreams[dateKey] = {
				error: fs.createWriteStream(`./logs/${currentDate}-error.log`, {
					flags: "a",
				}),
				info: fs.createWriteStream(`./logs/${currentDate}-info.log`, {
					flags: "a",
				}),
				debug: fs.createWriteStream(`./logs/${currentDate}-debug.log`, {
					flags: "a",
				}),
				request: fs.createWriteStream(
					`./logs/${currentDate}-access.log`,
					{ flags: "a" },
				),
				sql: fs.createWriteStream(`./logs/${currentDate}-sql.log`, {
					flags: "a",
				}),
			};
		}

		return this.logStreams[dateKey][type];
	}

	/**
	 * Writes a log message to the appropriate log file
	 *
	 * @param message - The message to log
	 * @param type - The type of log to write
	 */
	log(message: string, type: LOG_TYPES) {
		const timestamp = dayjs().utc().toISOString();
		const stream = this.getLogStream(type);
		stream.write(`${timestamp} ${message}\n`);
	}

	/**
	 * Logs an error with appropriate formatting based on error type
	 *
	 * @param error - The error object to log
	 * @param c - Optional Hono context containing request information
	 */
	error(error: Error, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_ERROR) return;

		console.error(error);

		if (error instanceof DashboardError) {
			this.log(
				`DASHBOARD ERROR: ${error.errorCode} (${error.statusCode}) ${
					c?.req.method ?? "-"
				} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${
					c?.var.requestId ?? "-"
				} ${error.severity} ${error.message} ${
					["CRITICAL", "HIGH"].includes(error.severity)
						? `\n    ${error.stack}`
						: ""
				}`,
				"error",
			);
		} else if (error instanceof HTTPException) {
			this.log(
				`ERROR ${error.getResponse().status}: ${error.message} ${
					c?.req.method ?? "-"
				} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${
					c?.var.requestId ?? "-"
				}\n    ${error.stack}`,
				"error",
			);
		} else {
			this.log(
				`ERROR: ${error.name} ${c?.req.method ?? "-"} ${
					c?.req.path ?? "-"
				} ${c?.var.uid ?? "-"} ${c?.var.requestId ?? "-"} ${
					error.message
				}\n    ${error.stack}`,
				"error",
			);
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

		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(`INFO: ${message}`);
		this.log(
			`${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${
				c?.var.uid ?? "-"
			} ${c?.var.requestId ?? "-"} ${message}`,
			"info",
		);
	}

	/**
	 * Logs a debug message
	 *
	 * @param message - The debug message to log
	 * @param c - Optional Hono context containing request information
	 */
	debug(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_DEBUG) return;

		// biome-ignore lint/suspicious/noConsole: This is a logger
		console.log(`DEBUG: ${message}`);
		this.log(
			`${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${
				c?.var.uid ?? "-"
			} ${c?.var.requestId ?? "-"} ${message}`,
			"debug",
		);
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
		this.log(message, "request");
	}

	/**
	 * Logs an SQL query with its parameters
	 *
	 * @param query - The SQL query string
	 * @param params - The parameters used in the query
	 */
	sql(query: string, params: unknown[]) {
		if (!appEnv.LOG_SQL) return;
		this.log(`SQL: ${query} ${JSON.stringify(params)}`, "sql");
	}
}

/**
 * Singleton instance of the Logger class for application-wide use
 */
const appLogger = new Logger();

export default appLogger;
