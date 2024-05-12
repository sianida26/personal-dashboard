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

const authInfo = createMiddleware<HonoEnv>(async (c, next) => {
	const { uid, currentUser } = c.var;

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

		c.set("currentUser", {
			name: user[0].users.name,
			permissions: Array.from(permissions),
			roles: Array.from(roles),
		});
	}

	await next();
});

export default authInfo;
