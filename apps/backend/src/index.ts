import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { rateLimiter } from "hono-rate-limiter";
import appEnv from "./appEnv";
import DashboardError from "./errors/DashboardError";
import authTokenMiddleware from "./middlewares/authTokenMiddleware";
import requestLogger from "./middlewares/requestLogger";
import appSettingsRoutes from "./routes/appSettingsRoute";
import microsoftAdminRouter from "./routes/auth/microsoft/admin";
import authRouter from "./routes/auth/route";
import dashboardRoutes from "./routes/dashboard/routes";
import devRoutes from "./routes/dev/route";
import moneyRoute from "./routes/money/route";
import notificationPreferencesRoute from "./routes/notificationPreferences/route";
import notificationsRoute from "./routes/notifications/route";
import permissionRoutes from "./routes/permissions/route";
import rolesRoute from "./routes/roles/route";
import ujianRoute from "./routes/ujian/route";
import usersRoute from "./routes/users/route";
import webhooksRoute from "./routes/webhooks";
import { jobQueueManager } from "./services/jobs";
import type HonoEnv from "./types/HonoEnv";
import { recordError } from "./utils/error-tracking";
import appLogger from "./utils/logger";

const app = new Hono<HonoEnv>();

/**
 * Global rate limiter for protected routes (non-auth).
 * Allows up to 1000 requests per minute per IP.
 * Uses in-memory store (not suitable for multi-instance production).
 */
export const appRoutes = app
	.use(
		cors({
			origin: "*",
		}),
	)
	.use(
		rateLimiter({
			windowMs: 60 * 1000, // 1 minute
			limit: 1000, // 1000 requests per window per IP
			keyGenerator: (c) =>
				c.req.header("x-forwarded-for") ||
				c.req.header("cf-connecting-ip") ||
				c.req.header("x-real-ip") ||
				c.req.header("host") ||
				"unknown",
			standardHeaders: true,
		}),
	)
	.use(authTokenMiddleware)
	.use(requestLogger)
	.route("/auth", authRouter)
	.route("/auth/microsoft/admin", microsoftAdminRouter)
	.route("/users", usersRoute)
	.route("/permissions", permissionRoutes)
	.route("/dashboard", dashboardRoutes)
	.route("/roles", rolesRoute)
	.route("/ujian", ujianRoute)
	.route("/money", moneyRoute)
	.route("/dev", devRoutes)
	.route("/app-settings", appSettingsRoutes)
	.route("/notifications", notificationsRoute)
	.route("/notification-preferences", notificationPreferencesRoute)
	.route("/webhooks", webhooksRoute)
	.get("/test", (c) => {
		return c.json({
			message: "Server is up",
		} as const);
	})
	.onError(async (err, c) => {
		// Record error to OpenTelemetry
		recordError(err, c);

		appLogger.error(err, c);
		if (err instanceof DashboardError) {
			return c.json(
				{
					message: err.message,
					errorCode: err.errorCode,
					formErrors: err.formErrors,
				},
				err.statusCode,
			);
		}
		if (err instanceof HTTPException) {
			return c.json(
				{
					message: err.message,
				},
				err.status,
			);
		}
		return c.json(
			{
				message:
					"Something is wrong in our side. We're working to fix it",
			},
			500,
		);
	});

// Initialize job queue manager
await jobQueueManager.initialize();

// Handle graceful shutdown
process.on("SIGTERM", async () => {
	appLogger.info("Received SIGTERM, shutting down gracefully");
	await jobQueueManager.shutdown();
	process.exit(0);
});

process.on("SIGINT", async () => {
	appLogger.info("Received SIGINT, shutting down gracefully");
	await jobQueueManager.shutdown();
	process.exit(0);
});

export default {
	fetch: app.fetch,
	port: appEnv.APP_PORT,
	hostname: appEnv.APP_HOST,
};

export type AppType = typeof appRoutes;
