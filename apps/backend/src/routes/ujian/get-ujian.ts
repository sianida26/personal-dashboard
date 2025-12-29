import { paginationRequestSchema } from "@repo/validation";
import { desc, ilike, sql } from "drizzle-orm";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /ujian - Get all ujian with pagination
 */
const getUjianRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/",
		checkPermission("ujian.read"),
		requestValidator("query", paginationRequestSchema),
		async (c) => {
			const { page, limit, q } = c.req.valid("query");

			const totalCountQuery =
				sql<number>`(SELECT count(*) FROM ${ujian})`.as("fullCount");

			const result = await db.query.ujian.findMany({
				orderBy: [desc(ujian.createdAt)],
				extras: {
					fullCount: totalCountQuery,
				},
				with: {
					creator: {
						columns: {
							id: true,
							name: true,
							username: true,
						},
					},
					questions: {
						columns: {
							id: true,
						},
					},
				},
				offset: (page - 1) * limit,
				limit,
				where: q ? ilike(ujian.title, `%${q}%`) : undefined,
			});

			const data = result.map(({ fullCount, questions, ...rest }) => ({
				...rest,
				totalQuestions: questions.length,
			}));

			return c.json({
				data,
				_metadata: {
					currentPage: page,
					totalPages: Math.ceil(
						(Number(result[0]?.fullCount) ?? 0) / limit,
					),
					totalItems: Number(result[0]?.fullCount) ?? 0,
					perPage: limit,
				},
			});
		},
	);

export default getUjianRoute;
