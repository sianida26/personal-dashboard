import { Hono } from "hono";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { paginationRequestSchema } from "@repo/validation";
import { desc, sql } from "drizzle-orm";

const rolesRoute = new Hono()
	//get all permissions
	.get(
		"/",
		checkPermission("roles.read"),
		requestValidator("query", paginationRequestSchema),
		async (c) => {
			const { includeTrashed, page, limit, q } = c.req.valid("query");

			const totalCountQuery =
				sql<number>`(SELECT count(*) FROM ${rolesSchema})`.as(
					"fullCount"
				);

			const result = await db.query.rolesSchema.findMany({
				orderBy: [desc(rolesSchema.createdAt)],
				extras: {
					fullCount: totalCountQuery,
				},
				offset: page * limit,
				limit,
				where: q ? sql`(${rolesSchema.name} ILIKE ${q})` : undefined,
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
	);

export default rolesRoute;
