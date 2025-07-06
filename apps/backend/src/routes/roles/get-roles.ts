import { paginationRequestSchema } from "@repo/validation";
import { and, desc, eq, not, sql } from "drizzle-orm";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /roles - Get all roles with pagination
 * Excludes the Super Admin role from the results
 */
const getRolesRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/",
		checkPermission("roles.read"),
		requestValidator("query", paginationRequestSchema),
		async (c) => {
			const { page, limit, q } = c.req.valid("query");

			const totalCountQuery =
				sql<number>`(SELECT count(*) FROM ${rolesSchema})`.as(
					"fullCount",
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
				offset: (page - 1) * limit,
				limit,
				where: and(
					not(eq(rolesSchema.name, "Super Admin")),
					q ? sql`(${rolesSchema.name} ILIKE ${q})` : undefined,
				),
			});

			const data = result.map(
				({ fullCount, permissionsToRoles, ...rest }) => {
					return {
						...rest,
						permissions: permissionsToRoles.map(
							(p) => p.permission.code,
						),
					};
				},
			);

			return c.json({
				data,
				_metadata: {
					currentPage: page,
					totalPages: Math.ceil(
						(Number(result[0]?.fullCount) ?? 0) / limit,
					),
					totalItems: (Number(result[0]?.fullCount) ?? 1) - 1, //exclude Super Admin
					perPage: limit,
				},
			});
		},
	);

export default getRolesRoute;
