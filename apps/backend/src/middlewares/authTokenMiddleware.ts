import { createMiddleware } from "hono/factory";
import type HonoEnv from "../types/HonoEnv";
import { verifyAccessToken } from "../utils/authUtils";

const authTokenMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
	const authHeader = c.req.header("Authorization");

	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.substring(7);
		const payload = await verifyAccessToken(token);

		if (payload) c.set("uid", payload.uid);
	}

	await next();
});

export default authTokenMiddleware;
