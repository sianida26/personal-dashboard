import { createMiddleware } from "hono/factory";
import HonoEnv from "../types/HonoEnv";
import appEnv from "../appEnv";
import { createId } from "@paralleldrive/cuid2";
import appLogger from "../utils/logger";

/**
 * Middleware for logging requests in the Hono framework.
 *
 * This middleware generates a unique request ID for each incoming request,
 * logs the request details if logging is enabled, and calculates the response time.
 *
 * @param c - The context object which contains request/response and environment information.
 * @param next - The next middleware function in the stack to be called.
 *
 * @returns A promise that resolves when the middleware processing is complete.
 */
const requestLogger = createMiddleware<HonoEnv>(async (c, next) => {
	c.set("requestId", createId());

	//check wether should be logged or not based on the env value
	if (appEnv.LOG_REQUEST) {
		const startTime = performance.now();
		await next();
		const endTime = performance.now();
		const responseTime = Math.floor(endTime - startTime);
		appLogger.request(c, responseTime);
	} else {
		await next();
	}
});

export default requestLogger;
