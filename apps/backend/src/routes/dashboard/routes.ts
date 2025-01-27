import { and, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import sidebarMenus from "../../data/sidebarMenus";
import db from "../../drizzle";
import { permissionsSchema } from "../../drizzle/schema/permissions";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import { permissionsToUsers } from "../../drizzle/schema/permissionsToUsers";
import { rolesSchema } from "../../drizzle/schema/roles";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import { users } from "../../drizzle/schema/users";
import { forbidden } from "../../errors/DashboardError";
import type { SidebarMenu } from "../../types";
import type HonoEnv from "../../types/HonoEnv";
import type {
	SidebarMenuChildItem,
	SidebarMenuItem,
} from "../../types/SidebarMenu";

const router = new Hono<HonoEnv>();

const dashboardRoutes = router.get("/getSidebarItems", async (c) => {
	const uid = c.var.uid;

	// Check if user ID is present
	if (!uid) throw forbidden();

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
		.leftJoin(permissionsToUsers, eq(permissionsToUsers.userId, users.id))
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

	// If no permissions found, forbid access
	if (!queryResult.length) throw forbidden();

	// Extract unique permission codes
	const permissions = [...new Set(queryResult.map((r) => r.permission.code))];

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
	const filteredMenus: SidebarMenu[] = sidebarMenus.reduce<SidebarMenu[]>(
		(acc, menu) => {
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
		},
		[],
	);

	// Return the filtered menus as JSON
	return c.json(filteredMenus);
});

export default dashboardRoutes;
