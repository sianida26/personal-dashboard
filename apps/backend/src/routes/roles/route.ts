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
					totalItems: Number(result[0]?.fullCount) ?? 0,
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
	);

export default rolesRoute;
