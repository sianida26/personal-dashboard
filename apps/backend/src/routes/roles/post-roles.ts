import { roleFormSchema } from "@repo/validation";
import db from "../../drizzle";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import { rolesSchema } from "../../drizzle/schema/roles";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * POST /roles - Create a new role
 * Creates a role with optional permissions
 */
const postRolesRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/",
		checkPermission("roles.create"),
		requestValidator("json", roleFormSchema),
		async (c) => {
			const { name, code, description, permissions } =
				c.req.valid("json");

			const [role] = await db
				.insert(rolesSchema)
				.values({
					name,
					code: code ?? name,
					description,
				})
				.returning();

			if (!role) {
				throw new Error("Failed to create role: Role not found");
			}

			if (permissions?.length) {
				const permissionRecords =
					await db.query.permissionsSchema.findMany();

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

export default postRolesRoute;
