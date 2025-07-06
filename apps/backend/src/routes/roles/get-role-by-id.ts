import type { PermissionCode } from "@repo/data";
import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";

/**
 * GET /roles/:id - Get a specific role by ID
 * Returns role details with associated permissions
 */
const getRoleByIdRoute = createHonoRoute()
	.use(authInfo)
	.get("/:id", checkPermission("roles.read"), async (c) => {
		const roleId = c.req.param("id");

		const role = await db.query.rolesSchema.findFirst({
			where: eq(rolesSchema.id, roleId),
			with: {
				permissionsToRoles: {
					with: {
						permission: true,
					},
				},
			},
		});

		if (!role) {
			throw notFound({ message: "Role not found" });
		}

		const permissions = role.permissionsToRoles.map(
			(p) => p.permission.code,
		) as PermissionCode[];

		return c.json({
			...role,
			permissions,
			permissionsToRoles: undefined,
		});
	});

export default getRoleByIdRoute;
