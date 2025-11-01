import {
	context as otelContext,
	SpanStatusCode,
	trace,
} from "@opentelemetry/api";
import { createId } from "@paralleldrive/cuid2";
import { createMiddleware } from "hono/factory";
import appEnv from "../appEnv";
import type HonoEnv from "../types/HonoEnv";
import appLogger from "../utils/logger";

/**
 * Middleware for logging requests and creating OpenTelemetry spans.
 *
 * This middleware:
 * - Generates a unique request ID for each incoming request
 * - Creates OpenTelemetry spans for distributed tracing (if enabled)
 * - Logs request details if logging is enabled
 * - Calculates response time
 * - Enriches spans with user context and route information
 *
 * @param c - The context object which contains request/response and environment information.
 * @param next - The next middleware function in the stack to be called.
 *
 * @returns A promise that resolves when the middleware processing is complete.
 */
const requestLogger = createMiddleware<HonoEnv>(async (c, next) => {
	c.set("requestId", createId());

	const startTime = performance.now();

	// Create OpenTelemetry span if enabled
	let span:
		| ReturnType<ReturnType<typeof trace.getTracer>["startSpan"]>
		| undefined;

	if (appEnv.OTEL_ENABLED) {
		const { req } = c;
		const tracer = trace.getTracer(appEnv.OTEL_SERVICE_NAME);

		// Use actual path for span name
		const spanName = `${req.method} ${req.path}`;

		// Create a new span for this HTTP request
		span = tracer.startSpan(spanName);

		// Extract route pattern for the route attribute
		const route = extractRoutePattern(req.path, req.method);

		// Set HTTP attributes
		span.setAttribute("http.method", req.method);
		span.setAttribute("http.route", route);
		span.setAttribute("http.url", req.url);
		span.setAttribute("http.path", req.path);
		span.setAttribute("http.user_agent", req.header("user-agent") || "");
		span.setAttribute("request.start_time", new Date().toISOString());
		span.setAttribute("request.id", c.get("requestId"));
	}

	try {
		// Clone the request to preserve the body for logging
		const originalRequest = appEnv.LOG_REQUEST
			? c.req.raw.clone()
			: undefined;

		// Execute the request within the span context (if span exists)
		if (span) {
			await otelContext.with(
				trace.setSpan(otelContext.active(), span),
				async () => {
					await next();
				},
			);
		} else {
			await next();
		}

		const endTime = performance.now();
		const responseTime = Math.floor(endTime - startTime);

		// Add user context to span after request is processed (after authInfo middleware)
		if (span) {
			const user = c.var.currentUser;
			const uid = c.var.uid;

			if (uid) {
				span.setAttribute("user.id", uid);
			}

			if (user) {
				span.setAttribute("user.name", user.name);

				if (user.email) {
					span.setAttribute("user.email", user.email);
				}

				// Add user roles for better context
				if (user.roles?.length > 0) {
					span.setAttribute("user.roles", user.roles.join(","));
				}
			}

			// Add response information
			const status = c.res?.status || 200;
			span.setAttribute("http.status_code", status);
			span.setAttribute("response.status_code", status);
			span.setAttribute("response.end_time", new Date().toISOString());
			span.setAttribute("response.time_ms", responseTime);

			// Mark span as error if status code indicates failure
			if (status >= 400) {
				span.setStatus({ code: SpanStatusCode.ERROR });
			}
		}

		// Log the request if enabled
		if (appEnv.LOG_REQUEST && originalRequest) {
			const originalReq = c.req.raw;
			c.req.raw = originalRequest;
			appLogger.request(c, responseTime);
			c.req.raw = originalReq;
		}
	} catch (error) {
		// Record the exception and mark span as error
		if (span) {
			span.recordException(error as Error);
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: (error as Error).message,
			});
		}
		throw error;
	} finally {
		// Always end the span
		span?.end();
	}
});

/**
 * Extract route pattern from request path
 * This maps actual paths to their route templates
 */
function extractRoutePattern(path: string, method: string): string {
	const methodPath = `${method} ${path}`;

	// Define route patterns (these should match your actual routes)
	const routePatterns: Array<{ pattern: RegExp; template: string }> = [
		// Auth routes
		{ pattern: /^GET \/auth\/.*/, template: "GET /auth/*" },
		{ pattern: /^POST \/auth\/login$/, template: "POST /auth/login" },
		{ pattern: /^POST \/auth\/logout$/, template: "POST /auth/logout" },

		// User routes
		{ pattern: /^GET \/users$/, template: "GET /users" },
		{ pattern: /^GET \/users\/[^/]+$/, template: "GET /users/:id" },
		{ pattern: /^POST \/users$/, template: "POST /users" },
		{ pattern: /^PUT \/users\/[^/]+$/, template: "PUT /users/:id" },
		{ pattern: /^DELETE \/users\/[^/]+$/, template: "DELETE /users/:id" },

		// Role routes
		{ pattern: /^GET \/roles$/, template: "GET /roles" },
		{ pattern: /^GET \/roles\/[^/]+$/, template: "GET /roles/:id" },
		{ pattern: /^POST \/roles$/, template: "POST /roles" },
		{ pattern: /^PUT \/roles\/[^/]+$/, template: "PUT /roles/:id" },
		{ pattern: /^DELETE \/roles\/[^/]+$/, template: "DELETE /roles/:id" },

		// Permission routes
		{ pattern: /^GET \/permissions$/, template: "GET /permissions" },
		{
			pattern: /^GET \/permissions\/[^/]+$/,
			template: "GET /permissions/:id",
		},

		// Dashboard routes
		{ pattern: /^GET \/dashboard\/.*/, template: "GET /dashboard/*" },

		// App settings routes
		{ pattern: /^GET \/app-settings$/, template: "GET /app-settings" },
		{ pattern: /^POST \/app-settings$/, template: "POST /app-settings" },
		{
			pattern: /^PUT \/app-settings\/[^/]+$/,
			template: "PUT /app-settings/:id",
		},
		{
			pattern: /^DELETE \/app-settings\/[^/]+$/,
			template: "DELETE /app-settings/:id",
		},

		// Notification routes
		{ pattern: /^GET \/notifications$/, template: "GET /notifications" },
		{
			pattern: /^GET \/notifications\/[^/]+$/,
			template: "GET /notifications/:id",
		},
		{ pattern: /^POST \/notifications$/, template: "POST /notifications" },
		{
			pattern: /^PUT \/notifications\/[^/]+$/,
			template: "PUT /notifications/:id",
		},
		{
			pattern: /^DELETE \/notifications\/[^/]+$/,
			template: "DELETE /notifications/:id",
		},

		// Microsoft Graph Admin routes
		{
			pattern: /^GET \/auth\/microsoft\/admin\/.*/,
			template: "GET /auth/microsoft/admin/*",
		},

		// Test and health routes
		{ pattern: /^GET \/test$/, template: "GET /test" },
		{ pattern: /^GET \/health$/, template: "GET /health" },

		// Dev routes
		{ pattern: /^.*\/dev\/.*/, template: `${method} /dev/*` },
	];

	// Find matching pattern
	for (const { pattern, template } of routePatterns) {
		if (pattern.test(methodPath)) {
			return template;
		}
	}

	// If no specific pattern matches, return a generic pattern
	// Split path and replace IDs with :id
	const parts = path.split("/").map((part) => {
		// If part looks like an ID (UUID, number, etc.), replace with :id
		if (
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				part,
			)
		) {
			return ":id";
		}
		if (/^\d+$/.test(part)) {
			return ":id";
		}
		return part;
	});

	return `${method} ${parts.join("/")}`;
}

export default requestLogger;
