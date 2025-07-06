import { roleFormSchema } from "@repo/validation";
import { and, eq, not } from "drizzle-orm";
import db from "../../drizzle";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import { rolesSchema } from "../../drizzle/schema/roles";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * PATCH /roles/:id - Update a role by ID
 * Updates role details and associated permissions
 * Prevents updating the Super Admin role
 */
const patchRoleByIdRoute = createHonoRoute()
	.use(authInfo)
	.patch(
		"/:id",
		checkPermission("roles.update"),
		requestValidator("json", roleFormSchema),
		async (c) => {
			const roleId = c.req.param("id");
			const { name, code, description, permissions } =
				c.req.valid("json");

			const [role] = await db
				.update(rolesSchema)
				.set({
					name,
					code: code ?? name,
					description,
				})
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

			if (permissions?.length) {
				const permissionRecords =
					await db.query.permissionsSchema.findMany();

				await db
					.delete(permissionsToRoles)
					.where(eq(permissionsToRoles.roleId, roleId));

				await db.insert(permissionsToRoles).values(
					permissions.map((permissionCode) => ({
						roleId: role.id,
						permissionId:
							permissionRecords.find(
								(x) => x.code === permissionCode,
							)?.id ??
							(() => {
								throw new Error(
									`Permission code ${permissionCode} not found`,
								);
							})(),
					})),
				);
			}

			return c.json(role);
		},
	);

export default patchRoleByIdRoute;
