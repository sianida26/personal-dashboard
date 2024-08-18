import * as fs from "fs";
import DashboardError from "../errors/DashboardError";
import { HTTPException } from "hono/http-exception";
import dayjs from "dayjs";
import DayjsUTC from "dayjs/plugin/utc";
import { Context } from "hono";
import HonoEnv from "../types/HonoEnv";
import appEnv from "../appEnv";

dayjs.extend(DayjsUTC);

type LOG_TYPES = "error" | "info" | "debug" | "request";

class Logger {
	private errorLogFile: string;
	private debugLogFile: string;
	private infoLogFile: string;
	private requestLogFile: string;
	private errorLogStream: fs.WriteStream;
	private debugLogStream: fs.WriteStream;
	private infoLogStream: fs.WriteStream;
	private requestLogStream: fs.WriteStream;

	constructor() {
		const currentDate = dayjs().utc().format("YYYYMMDD");

		this.errorLogFile = `./logs/${currentDate}-error.log`;
		this.infoLogFile = `./logs/${currentDate}-info.log`;
		this.debugLogFile = `./logs/${currentDate}-debug.log`;
		this.requestLogFile = `./logs/${currentDate}-access.log`;
		// this.logFile = "./logs/log.LOG";
		this.errorLogStream = fs.createWriteStream(this.errorLogFile, {
			flags: "a",
		});

		this.infoLogStream = fs.createWriteStream(this.infoLogFile, {
			flags: "a",
		});

		this.debugLogStream = fs.createWriteStream(this.debugLogFile, {
			flags: "a",
		});

		this.requestLogStream = fs.createWriteStream(this.requestLogFile, {
			flags: "a",
		});
	}

	log(message: string, type: LOG_TYPES) {
		const timestamp = dayjs().utc().toISOString();

		let stream: fs.WriteStream | null = null;

		switch (type) {
			case "error":
				stream = this.errorLogStream;
				break;
			case "info":
				stream = this.infoLogStream;
				break;
			case "debug":
				stream = this.debugLogStream;
				break;
			case "request":
				stream = this.requestLogStream;
				break;
			default:
				throw new Error("Invalid LOG TYPE");
		}

		stream.write(`${timestamp} ${message}\n`);
	}

	error(error: Error, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_ERROR) return;

		console.error(error);

		if (error instanceof DashboardError) {
			this.log(
				`DASHBOARD ERROR: ${error.errorCode} (${error.statusCode}) ${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${c?.var.requestId ?? "-"}\n	${error.severity}\n    ${error.message} ${["CRITICAL", "HIGH"].includes(error.severity) ? `\n    ${error.stack}` : ""}`,
				"error"
			);
		} else if (error instanceof HTTPException) {
			this.log(
				`ERROR ${error.getResponse().status}: ${error.message} ${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${c?.var.requestId ?? "-"}\n    ${error.stack}`,
				"error"
			);
		} else {
			this.log(
				`ERROR: ${error.name} ${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${c?.var.requestId ?? "-"}\n    ${error.message}\n    ${error.stack}`,
				"error"
			);
		}
	}

	info(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_INFO) return;
		console.log(`INFO: ${message}`);
		this.log(
			`${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${c?.var.requestId ?? "-"} ${message}`,
			"info"
		);
	}

	debug(message: string, c?: Context<HonoEnv>) {
		if (!appEnv.LOG_DEBUG) return;
		console.log(`DEBUG: ${message}`);
		this.log(
			`${c?.req.method ?? "-"} ${c?.req.path ?? "-"} ${c?.var.uid ?? "-"} ${c?.var.requestId ?? "-"} ${message}`,
			"debug"
		);
	}

	request(c: Context<HonoEnv>, responseTime?: number) {
		if (!appEnv.LOG_REQUEST) return;
		const message = `${c.req.method} ${c.req.path} ${c.var.uid ?? "-"} ${c.var.requestId ?? "-"} ${c.res.status} ${responseTime ?? "-"} ${c.req.header("User-Agent") ?? "-"}`;
		console.log(`REQ: ${message}`);
		this.log(message, "request");
	}
}

const appLogger = new Logger();

export default appLogger;
