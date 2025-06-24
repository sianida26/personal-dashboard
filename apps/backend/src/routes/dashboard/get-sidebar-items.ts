import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { forbidden } from "../../errors/DashboardError";
import db from "../../drizzle";
import { permissionsSchema } from "../../drizzle/schema/permissions";
import { users } from "../../drizzle/schema/users";
import { rolesSchema } from "../../drizzle/schema/roles";
import { permissionsToUsers } from "../../drizzle/schema/permissionsToUsers";
import { and, eq, or } from "drizzle-orm";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import type { SidebarMenu } from "../../types";
import type { SidebarMenuItem } from "../../types/SidebarMenu";
import type { SidebarMenuChildItem } from "../../types/SidebarMenu";
import sidebarMenus from "../../data/sidebarMenus";

const router = createHonoRoute()
	.use(authInfo)
	.get(
		"/getSidebarItems",
		checkPermission("authenticated-only"),
		async (c) => {
			const uid = c.var.uid as string; // Safe to cast since checkPermission ensures authentication

			// Query the database to get user permissions
			const queryResult = await db
				.selectDistinctOn([permissionsSchema.id], {
					id: users.id,
					name: users.name,
					email: users.email,
					isEnabled: users.isEnabled,
					role: {
						id: rolesSchema.id,
						code: rolesSchema.code,
					},
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
						eq(
							permissionsSchema.id,
							permissionsToUsers.permissionId,
						),
						eq(
							permissionsSchema.id,
							permissionsToRoles.permissionId,
						),
					),
				);

			// If no permissions found, forbid access
			if (!queryResult.length) throw forbidden();

			// Extract unique permission codes
			const permissions = [
				...new Set(queryResult.map((r) => r.permission.code)),
			];

			// Helper function to check if a menu item is allowed
			const hasPermission = (
				item: SidebarMenuItem | SidebarMenuChildItem,
				userPermissions: string[],
			): boolean => {
				if (!item.allowedPermissions) {
					// If no permissions are specified, the item is accessible to all
					return true;
				}
				if (item.allowedPermissions.includes("*")) {
					// "*" means accessible to all users
					return true;
				}
				// Check if there's any intersection between item's permissions and user's permissions
				return item.allowedPermissions.some((perm) =>
					userPermissions.includes(perm),
				);
			};

			// Filter the sidebar menus based on permissions
			const filteredMenus: SidebarMenu[] = sidebarMenus.reduce<
				SidebarMenu[]
			>((acc, menu) => {
				if (menu.type === "group") {
					// If the menu is a group, filter its children
					const filteredChildren = menu.children.filter((child) =>
						hasPermission(child, permissions),
					);

					if (filteredChildren.length > 0) {
						// If there are visible children, include the group with the filtered children
						acc.push({ ...menu, children: filteredChildren });
					}
				} else {
					// If the menu is a single item, check its permission
					if (hasPermission(menu, permissions)) {
						acc.push(menu);
					}
				}
				return acc;
			}, []);

			// Return the filtered menus as JSON
			return c.json(filteredMenus);
		},
	);

export default router;
