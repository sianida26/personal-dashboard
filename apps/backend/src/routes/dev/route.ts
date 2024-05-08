import { Hono } from "hono";
import DashboardError from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import HonoEnv from "../../types/HonoEnv";

const devRoutes = new Hono<HonoEnv>()
	.use(authInfo)
	.get("/middleware", async (c) => {
		return c.json({
			message: "Middleware works!",
		});
	});

export default devRoutes;
