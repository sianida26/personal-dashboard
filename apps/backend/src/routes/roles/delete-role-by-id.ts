import { and, eq, not } from "drizzle-orm";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";

/**
 * DELETE /roles/:id - Delete a role by ID
 * Prevents deletion of the Super Admin role
 */
const deleteRoleByIdRoute = createHonoRoute()
	.use(authInfo)
	.delete("/:id", checkPermission("roles.delete"), async (c) => {
		const roleId = c.req.param("id");

		const [role] = await db
			.delete(rolesSchema)
			.where(
				and(
					eq(rolesSchema.id, roleId),
					not(eq(rolesSchema.name, "Super Admin")),
				),
			)
			.returning();

		if (!role) {
			throw notFound({ message: "Role not found" });
		}

		return c.json({ message: "Role deleted successfully" });
	});

export default deleteRoleByIdRoute;
