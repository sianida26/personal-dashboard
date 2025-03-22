import { and, eq, or } from "drizzle-orm";
import db from "../drizzle";
import { permissionsSchema } from "../drizzle/schema/permissions";
import { permissionsToRoles } from "../drizzle/schema/permissionsToRoles";
import { permissionsToUsers } from "../drizzle/schema/permissionsToUsers";
import { rolesSchema } from "../drizzle/schema/roles";
import { rolesToUsers } from "../drizzle/schema/rolesToUsers";
import { users } from "../drizzle/schema/users";
import { forbidden } from "../errors/DashboardError";
import type HonoEnv from "../types/HonoEnv";
import type { MiddlewareHandler } from "hono";
import type { ExtendedPermissionCodeWithAll } from "@repo/data";

/**
 * Middleware that checks if a user has the required permissions to access a route
 * @param requiredPermissions - An array of permissions that the user must have to access the route
 * @returns A middleware handler that checks permissions
 */
export const protect = (
	requiredPermissions: ExtendedPermissionCodeWithAll[],
): MiddlewareHandler<HonoEnv> => {
	return async (c, next) => {
		const uid = c.var.uid;

		// If uid is not present, the user is not authenticated
		if (!uid) {
			throw forbidden({ message: "Authentication required" });
		}

		// If requiredPermissions includes "*", allow all authenticated users
		if (requiredPermissions.includes("*")) {
			await next();
			return;
		}

		// Get user's permissions from database
		const queryResult = await db
			.selectDistinctOn([permissionsSchema.id], {
				id: users.id,
				permission: {
					id: permissionsSchema.id,
					code: permissionsSchema.code,
				},
			})
			.from(users)
			.where(and(eq(users.id, uid), eq(users.isEnabled, true)))
			.leftJoin(
				permissionsToUsers,
				eq(permissionsToUsers.userId, users.id),
			)
			.leftJoin(rolesToUsers, eq(rolesToUsers.userId, users.id))
			.leftJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
			.leftJoin(
				permissionsToRoles,
				eq(permissionsToRoles.roleId, rolesSchema.id),
			)
			.innerJoin(
				permissionsSchema,
				or(
					eq(permissionsSchema.id, permissionsToUsers.permissionId),
					eq(permissionsSchema.id, permissionsToRoles.permissionId),
				),
			);

		// If user has no permissions, forbid access
		if (!queryResult.length) {
			throw forbidden({ message: "Insufficient permissions" });
		}

		// Extract user's permissions codes
		const userPermissions = queryResult.map(
			(result) => result.permission.code,
		);

		// Check if user has any of the required permissions
		const hasRequiredPermission = requiredPermissions.some((permission) =>
			userPermissions.includes(permission),
		);

		if (!hasRequiredPermission) {
			throw forbidden({ message: "Insufficient permissions" });
		}

		await next();
	};
};
