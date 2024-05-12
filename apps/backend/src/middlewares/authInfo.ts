import { createMiddleware } from "hono/factory";
import HonoEnv from "../types/HonoEnv";
import db from "../drizzle";
import { users } from "../drizzle/schema/users";
import { permissionsToUsers } from "../drizzle/schema/permissionsToUsers";
import { rolesToUsers } from "../drizzle/schema/rolesToUsers";
import { and, eq, isNull, or } from "drizzle-orm";
import { rolesSchema } from "../drizzle/schema/roles";
import { permissionsToRoles } from "../drizzle/schema/permissionsToRoles";
import { permissionsSchema } from "../drizzle/schema/permissions";
import { RoleCode } from "../data/roles";
import { SpecificPermissionCode } from "../data/permissions";

/**
 * Middleware to load and set authentication information for a user.
 *
 * It queries the database to fetch user details, roles, and permissions based on the user ID provided in the context.
 * It joins several tables to efficiently gather all relevant data, and then processes this data to attach the user's roles and permissions to the context.
 * If the user is found and active, their details are added to the context for use in subsequent middleware or routes.
 *
 * @param c - The context provided by Hono, which includes environment and user-specific data.
 * @param next - The next middleware function in the chain.
 */
const authInfo = createMiddleware<HonoEnv>(async (c, next) => {
	const { uid, currentUser } = c.var;

	// Proceed only if uid is present and currentUser is not already set
	if (uid && !currentUser) {
		const user = await db
			.select()
			.from(users)
			.where(
				and(
					eq(users.id, uid),
					eq(users.isEnabled, true),
					isNull(users.deletedAt)
				)
			)
			.leftJoin(
				permissionsToUsers,
				eq(permissionsToUsers.userId, users.id)
			)
			.leftJoin(rolesToUsers, eq(rolesToUsers.userId, users.id))
			.leftJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
			.leftJoin(
				permissionsToRoles,
				eq(permissionsToRoles.roleId, rolesSchema.id)
			)
			.leftJoin(
				permissionsSchema,
				or(
					eq(permissionsSchema.id, permissionsToUsers.permissionId),
					eq(permissionsSchema.id, permissionsToRoles.permissionId)
				)
			);

		const roles = new Set<RoleCode>();
		const permissions = new Set<SpecificPermissionCode>();

		user.forEach((user) => {
			if (user.roles?.code) {
				roles.add(user.roles.code as RoleCode);
			}

			if (user.permissions?.code) {
				permissions.add(
					user.permissions.code as SpecificPermissionCode
				);
			}
		});

		// Setting the currentUser with fetched data
		c.set("currentUser", {
			name: user[0].users.name, // Assuming the first result is the user
			permissions: Array.from(permissions),
			roles: Array.from(roles),
		});
	}

	await next();
});

export default authInfo;
