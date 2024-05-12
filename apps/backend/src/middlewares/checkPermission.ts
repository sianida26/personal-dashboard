import { createMiddleware } from "hono/factory";
import { PermissionCode } from "../data/permissions";
import HonoEnv from "../types/HonoEnv";
import { unauthorized } from "../errors/DashboardError";

/**
 * Creates a middleware to check if the current user has the required permissions.
 *
 * This middleware checks if the current user's permissions include any of the specified
 * permissions required to proceed. It allows proceeding if the user has the requisite
 * permissions or denies access by triggering an unauthorized error.
 *
 * @param {PermissionCode[]} permissions - An array of permissions to check against the current user's permissions.
 * @returns {import('hono').Middleware<HonoEnv>} A middleware function for the Hono framework.
 */
const checkPermission = (...permissions: PermissionCode[]) =>
	createMiddleware<HonoEnv>(async (c, next) => {
		// Allow all operations if the permissions include a wildcard "*"
		if (permissions.includes("*")) {
			await next();
			return;
		}

		const currentUser = c.var.currentUser;
		// Proceed if the user exists and has any of the required permissions
		if (currentUser) {
			const hasPermission = currentUser.permissions.some((p) =>
				permissions.includes(p)
			);
			if (hasPermission) {
				await next();
			} else {
				unauthorized();
			}
		} else {
			// No current user found, trigger unauthorized error
			unauthorized();
		}
	});

export default checkPermission;
