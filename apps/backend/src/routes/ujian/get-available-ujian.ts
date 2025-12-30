import { and, count, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import { ujianAttempts } from "../../drizzle/schema/ujianAttempts";
import { ujianQuestions } from "../../drizzle/schema/ujianQuestions";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /ujian/available - List available ujian for students to take
 * Returns only active ujian that the user is eligible to take
 */
const getAvailableUjianRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/available",
		checkPermission("ujian.take"),
		requestValidator(
			"query",
			z.object({
				page: z.coerce.number().min(1).default(1),
				limit: z.coerce.number().min(1).max(100).default(10),
			}),
		),
		async (c) => {
			const uid = c.get("uid");
			const { page, limit } = c.req.valid("query");
			const offset = (page - 1) * limit;

			if (!uid) {
				return unauthorized();
			}

			// Get all active ujian with their question counts and user's attempt status
			const availableUjian = await db
				.select({
					id: ujian.id,
					title: ujian.title,
					description: ujian.description,
					maxQuestions: ujian.maxQuestions,
					practiceMode: ujian.practiceMode,
					allowResubmit: ujian.allowResubmit,
					totalQuestions: count(ujianQuestions.id),
					hasAttempted: sql<boolean>`EXISTS (
						SELECT 1 FROM ujian_attempts 
						WHERE ujian_attempts.ujian_id = ${ujian.id} 
						AND ujian_attempts.user_id = ${uid}
						AND ujian_attempts.status = 'completed'
					)`,
					hasInProgressAttempt: sql<boolean>`EXISTS (
						SELECT 1 FROM ujian_attempts 
						WHERE ujian_attempts.ujian_id = ${ujian.id} 
						AND ujian_attempts.user_id = ${uid}
						AND ujian_attempts.status = 'in_progress'
					)`,
					inProgressAttemptId: sql<string | null>`(
						SELECT id FROM ujian_attempts 
						WHERE ujian_attempts.ujian_id = ${ujian.id} 
						AND ujian_attempts.user_id = ${uid}
						AND ujian_attempts.status = 'in_progress'
						LIMIT 1
					)`,
				})
				.from(ujian)
				.leftJoin(ujianQuestions, eq(ujianQuestions.ujianId, ujian.id))
				.where(eq(ujian.isActive, true))
				.groupBy(ujian.id)
				.limit(limit)
				.offset(offset);

			// Get total count for pagination
			const [totalResult] = await db
				.select({ count: count() })
				.from(ujian)
				.where(eq(ujian.isActive, true));

			// Filter out ujian that user has completed and can't resubmit
			const filteredUjian = availableUjian.filter((u) => {
				// If hasn't attempted yet, show it
				if (!u.hasAttempted) return true;
				// If has attempted but resubmit is allowed, show it
				if (u.allowResubmit) return true;
				// If has in-progress attempt, show it
				if (u.hasInProgressAttempt) return true;
				return false;
			});

			return c.json({
				data: filteredUjian.map((u) => ({
					...u,
					canStart:
						!u.hasAttempted || u.allowResubmit || u.hasInProgressAttempt,
				})),
				pagination: {
					page,
					limit,
					total: totalResult?.count ?? 0,
					totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
				},
			});
		},
	);

export default getAvailableUjianRoute;
