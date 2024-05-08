import { createMiddleware } from "hono/factory";
import { PermissionCode } from "../data/permissions";
import HonoEnv from "../types/HonoEnv";
import { unauthorized } from "../errors/DashboardError";

const checkPermission = (...permissions: PermissionCode[]) =>
	createMiddleware<HonoEnv>(async (c, next) => {
		if (permissions.includes("*")) await next();
		else if (c.var.currentUser) {
			if (
				c.var.currentUser.permissions.some((p) =>
					permissions.includes(p)
				)
			)
				await next();
		} else {
			unauthorized();
		}
	});

export default checkPermission;
