import { serve } from "@hono/node-server";
import { configDotenv } from "dotenv";
import { Hono } from "hono";
import authRoutes from "./routes/auth/route";
import usersRoute from "./routes/users/route";
import { verifyAccessToken } from "./utils/authUtils";
import permissionRoutes from "./routes/permissions/route";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { getSignedCookie } from "hono/cookie";
import dashboardRoutes from "./routes/dashboard/routes";
import rolesRoute from "./routes/roles/route";
import { logger } from "hono/logger";
import DashboardError from "./errors/DashboardError";
import HonoEnv from "./types/HonoEnv";
import devRoutes from "./routes/dev/route";
import appEnv from "./appEnv";

configDotenv();

const app = new Hono<HonoEnv>();

const routes = app
	.use(logger())
	.use(
		cors({
			origin: "*",
		})
	)
	.use(async (c, next) => {
		const cookieSecret = appEnv.COOKIE_SECRET;

		if (!cookieSecret)
			throw new HTTPException(500, {
				message: "The 'COOKIE_SECRET' env is not set",
			});

		const accessToken = await getSignedCookie(
			c,
			cookieSecret,
			"access_token",
			"secure"
		);

		if (accessToken) {
			const payload = await verifyAccessToken(accessToken);

			if (payload) c.set("uid", payload.uid);
		} else {
			const authHeader = c.req.header("Authorization");

			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.substring(7);
				const payload = await verifyAccessToken(token);

				if (payload) c.set("uid", payload.uid);
			}
		}

		await next();
	})
	.use(async (c, next) => {
		console.log("Incoming request:", c.req.path);
		await next();
		console.log("Outgoing response:", c.res.status);
		if (c.res.status !== 200) {
			console.log(await c.res.text());
		}
	})
	.get("/test", (c) => {
		return c.json({
			message: "Server is up",
		} as const);
	})
	.route("/auth", authRoutes)
	.route("/users", usersRoute)
	.route("/permissions", permissionRoutes)
	.route("/dashboard", dashboardRoutes)
	.route("/roles", rolesRoute)
	.route("/dev", devRoutes)
	.onError((err, c) => {
		if (err instanceof DashboardError) {
			return c.json(
				{
					message: err.message,
					errorCode: err.errorCode,
					formErrors: err.formErrors,
				},
				err.statusCode
			);
		}
		if (err instanceof HTTPException) {
			console.log(err);
			return c.json(
				{
					message: err.message,
				},
				err.status
			);
		} else {
			console.error(err);
			return c.json(
				{
					message:
						"Something is wrong in our side. We're working to fix it",
				},
				500
			);
		}
	});

const port = appEnv.APP_PORT;
console.log(`Server is running on port ${port}`);
console.log(
	`Application is running on ${appEnv.APP_ENV.toUpperCase()} environment`
);

serve({
	fetch: app.fetch,
	port,
});

export type AppType = typeof routes;
