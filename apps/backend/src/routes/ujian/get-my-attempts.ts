import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujianAttempts } from "../../drizzle/schema/ujianAttempts";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /ujian/my-attempts - Get all attempts by the current user
 * Returns a list of all ujian attempts with their status and scores
 */
const getMyAttemptsRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/my-attempts",
		checkPermission("ujian.take"),
		requestValidator(
			"query",
			z.object({
				page: z.coerce.number().min(1).default(1),
				limit: z.coerce.number().min(1).max(100).default(10),
				status: z
					.enum(["in_progress", "completed", "abandoned", "all"])
					.default("all"),
			}),
		),
		async (c) => {
			const uid = c.get("uid");
			const { page, limit, status } = c.req.valid("query");
			const offset = (page - 1) * limit;

			if (!uid) {
				return unauthorized();
			}

			// Build where clause
			const whereConditions = [eq(ujianAttempts.userId, uid)];
			if (status !== "all") {
				whereConditions.push(eq(ujianAttempts.status, status));
			}

			// Get attempts with ujian details
			const attempts = await db.query.ujianAttempts.findMany({
				where: and(...whereConditions),
				with: {
					ujian: {
						columns: {
							id: true,
							title: true,
							description: true,
							practiceMode: true,
						},
					},
				},
				orderBy: [desc(ujianAttempts.createdAt)],
				limit,
				offset,
			});

			// Get total count for pagination
			const allAttempts = await db.query.ujianAttempts.findMany({
				where: and(...whereConditions),
				columns: { id: true },
			});

			return c.json({
				data: attempts.map((a) => ({
					id: a.id,
					ujianId: a.ujianId,
					ujianTitle: a.ujian.title,
					ujianDescription: a.ujian.description,
					practiceMode: a.ujian.practiceMode,
					status: a.status,
					startedAt: a.startedAt,
					completedAt: a.completedAt,
					score: a.score ? Number.parseFloat(a.score) : null,
					totalPoints: a.totalPoints,
				})),
				pagination: {
					page,
					limit,
					total: allAttempts.length,
					totalPages: Math.ceil(allAttempts.length / limit),
				},
			});
		},
	);

export default getMyAttemptsRoute;
