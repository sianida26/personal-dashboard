import { createMiddleware } from "hono/factory";
import type HonoEnv from "../types/HonoEnv";
import { verifyAccessToken } from "../utils/authUtils";

const authTokenMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	let token: string | undefined;

	if (authHeader?.startsWith("Bearer ")) {
		token = authHeader.substring(7);
	} else {
		token = c.req.query("token") ?? undefined;
	}

	if (token) {
		const payload = await verifyAccessToken(token);

		if (payload) c.set("uid", payload.uid);
	}

	await next();
});

export default authTokenMiddleware;
