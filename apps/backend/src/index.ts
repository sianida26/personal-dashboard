import { configDotenv } from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import appEnv from "./appEnv";
import DashboardError from "./errors/DashboardError";
import authTokenMiddleware from "./middlewares/authTokenMiddleware";
import requestLogger from "./middlewares/requestLogger";
import appSettingsRoutes from "./routes/appSettingsRoute";
import dashboardRoutes from "./routes/dashboard/routes";
import devRoutes from "./routes/dev/route";
import permissionRoutes from "./routes/permissions/route";
import rolesRoute from "./routes/roles/route";
import usersRoute from "./routes/users/route";
import type HonoEnv from "./types/HonoEnv";
import appLogger from "./utils/logger";
import authRouter from "./routes/auth/route";
import microsoftAdminRouter from "./routes/auth/microsoft/admin";

configDotenv();

const app = new Hono<HonoEnv>();

const routes = app
	.use(requestLogger)
	.use(
		cors({
			origin: "*",
		}),
	)
	.use(authTokenMiddleware)
	.route("/auth", authRouter)
	.route("/auth/microsoft/admin", microsoftAdminRouter)
	.route("/users", usersRoute)
	.route("/permissions", permissionRoutes)
	.route("/dashboard", dashboardRoutes)
	.route("/roles", rolesRoute)
	.route("/dev", devRoutes)
	.route("/app-settings", appSettingsRoutes)
	.get("/test", (c) => {
		return c.json({
			message: "Server is up",
		} as const);
	})
	.onError((err, c) => {
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

export default {
	fetch: app.fetch,
	port: appEnv.APP_PORT,
	hostname: appEnv.APP_HOST,
};

export type AppType = typeof routes;
