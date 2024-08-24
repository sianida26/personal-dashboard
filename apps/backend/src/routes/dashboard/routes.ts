import sidebarMenus from "../../data/sidebarMenus";
import db from "../../drizzle";
import { permissionsSchema } from "../../drizzle/schema/permissions";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import { permissionsToUsers } from "../../drizzle/schema/permissionsToUsers";
import { rolesSchema } from "../../drizzle/schema/roles";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import { users } from "../../drizzle/schema/users";
import { SidebarMenu } from "../../types";
import { forbidden } from "../../utils/httpErrors";
import { and, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { HonoVariables } from "../..";

const router = new Hono<{ Variables: HonoVariables }>();

const dashboardRoutes = router.get("/getSidebarItems", async (c) => {
	const uid = c.var.uid;

	if (!uid) throw forbidden();

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
			eq(permissionsToRoles.roleId, rolesSchema.id)
		)
		.innerJoin(
			permissionsSchema,
			or(
				eq(permissionsSchema.id, permissionsToUsers.permissionId),
				eq(permissionsSchema.id, permissionsToRoles.permissionId)
			)
		);

	if (!queryResult.length) throw forbidden();

	const permissions = [...new Set(queryResult.map((r) => r.permission.code))];

	const filteredMenus = sidebarMenus.reduce(
		(prev, menu) => {
			//if menu has children, check if any permission match
			if (menu.children) {
				const children = menu.children.filter(
					(child) =>
						child.allowedPermissions?.some((perm) =>
							permissions.includes(perm)
						) || child.allowedPermissions?.includes("*")
				);

				if (children.length) {
					//add children and hide the allowed permissions field
					return [
						...prev,
						{ ...menu, children, allowedPermissions: undefined },
					];
				}
			}

			//if menu has no children, check if permission match
			else {
				if (
					menu.allowedPermissions?.some((perm) =>
						permissions.includes(perm)
					) ||
					menu.allowedPermissions?.includes("*")
				) {
					//add menu and hide the allowed permissions field
					return [
						...prev,
						{ ...menu, allowedPermissions: undefined },
					];
				}
			}

			//dont add permission to menu if it doesnt match
			return prev;
		},
		[] as Omit<SidebarMenu, "allowedPermissions">[]
	);

	//I don't know why but it is not working without redefining the type
	return c.json(
		filteredMenus as {
			label: string;
			icon: Record<"tb", string>;
			children?: {
				label: string;
				link: string;
			}[];
			link?: string;
			color?: string;
		}[]
	);
});

export default dashboardRoutes;
