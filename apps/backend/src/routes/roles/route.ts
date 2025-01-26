import { Hono } from "hono";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { paginationRequestSchema, roleFormSchema } from "@repo/validation";
import { and, desc, eq, not, sql } from "drizzle-orm";
import HonoEnv from "../../types/HonoEnv";
import authInfo from "../../middlewares/authInfo";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import { notFound } from "../../errors/DashboardError";
import { PermissionCode } from "@repo/data";

const rolesRoute = new Hono<HonoEnv>()
	.use(authInfo)
	//get all roles, but excludes the Super Admin role
	.get(
		"/",
		checkPermission("roles.read"),
		requestValidator("query", paginationRequestSchema),
		async (c) => {
			const { page, limit, q } = c.req.valid("query");

			const totalCountQuery =
				sql<number>`(SELECT count(*) FROM ${rolesSchema})`.as(
					"fullCount"
				);

			const result = await db.query.rolesSchema.findMany({
				orderBy: [desc(rolesSchema.createdAt)],
				extras: {
					fullCount: totalCountQuery,
				},
				with: {
					permissionsToRoles: {
						with: {
							permission: true,
						},
					},
				},
				offset: page * limit,
				limit,
				where: and(
					not(eq(rolesSchema.name, "Super Admin")),
					q ? sql`(${rolesSchema.name} ILIKE ${q})` : undefined
				),
			});

			return c.json({
				data: result,
				_metadata: {
					currentPage: page,
					totalPages: Math.ceil(
						(Number(result[0]?.fullCount) ?? 0) / limit
					),
					totalItems: (Number(result[0]?.fullCount) ?? 1) - 1, //exclude Super Admin
					perPage: limit,
				},
			});
		}
	)
	//create new permission
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

			if (permissions?.length) {
				const permissionRecords =
					await db.query.permissionsSchema.findMany();

				await db.insert(permissionsToRoles).values(
					permissions.map((permissionCode) => ({
						roleId: role.id,
						permissionId: permissionRecords.find(
							(x) => x.code === permissionCode
						)!.id,
					}))
				);
			}

			return c.json(role);
		}
	)
	//get role by id
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

		if (!role) throw notFound({ message: "Role not found" });

		const permissions = role.permissionsToRoles.map(
			(p) => p.permission.code
		) as PermissionCode[];

		return c.json({
			...role,
			permissions,
			permissionsToRoles: undefined,
		});
	})
	//update role by id
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
						not(eq(rolesSchema.name, "Super Admin"))
					)
				)
				.returning();

			if (!role) throw notFound({ message: "Role not found" });

			if (permissions?.length) {
				const permissionRecords =
					await db.query.permissionsSchema.findMany();

				await db
					.delete(permissionsToRoles)
					.where(eq(permissionsToRoles.roleId, roleId));

				await db.insert(permissionsToRoles).values(
					permissions.map((permissionCode) => ({
						roleId: role.id,
						permissionId: permissionRecords.find(
							(x) => x.code === permissionCode
						)!.id,
					}))
				);
			}

			return c.json(role);
		}
	)
	//delete role by id
	.delete("/:id", checkPermission("roles.delete"), async (c) => {
		const roleId = c.req.param("id");

		const [role] = await db
			.delete(rolesSchema)
			.where(
				and(
					eq(rolesSchema.id, roleId),
					not(eq(rolesSchema.name, "Super Admin"))
				)
			)
			.returning();

		if (!role) throw notFound({ message: "Role not found" });

		return c.json({ message: "Role deleted successfully" });
	});

export default rolesRoute;
