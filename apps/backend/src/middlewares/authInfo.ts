import type { PermissionCode } from "@repo/data";
import { and, eq, isNull } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type { RoleCode } from "../data/defaultRoles";
import db from "../drizzle";
import { users } from "../drizzle/schema/users";
import type HonoEnv from "../types/HonoEnv";

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
		const user = await db.query.users.findFirst({
			where: and(
				eq(users.id, uid),
				eq(users.isEnabled, true),
				isNull(users.deletedAt),
			),
			with: {
				// Include user-specific permissions
				permissionsToUsers: {
					with: {
						permission: true,
					},
				},

				// Include user roles, and their associated permissions
				rolesToUsers: {
					with: {
						role: {
							with: {
								permissionsToRoles: {
									with: {
										permission: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (user) {
			const roles = new Set<RoleCode>();
			const permissions = new Set<PermissionCode>();

			// Collect role-based permissions by iterating through each role
			for (const userRole of user.rolesToUsers) {
				roles.add(userRole.role.code as RoleCode);

				for (const permissionRole of userRole.role.permissionsToRoles) {
					permissions.add(permissionRole.permission.code as PermissionCode);
				}
			}

			// Collect user-specific permissions
			for (const userPermission of user.permissionsToUsers) {
				permissions.add(userPermission.permission.code as PermissionCode);
			}

			c.set("currentUser", {
				name: user.name,
				permissions: Array.from(permissions),
				roles: Array.from(roles),
			});
		}
	}

	await next();
});

export default authInfo;
