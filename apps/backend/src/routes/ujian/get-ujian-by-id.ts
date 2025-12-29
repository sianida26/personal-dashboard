import { eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /ujian/:id - Get ujian by ID with all questions
 */
const getUjianByIdRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/:id",
		checkPermission("ujian.read"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (c) => {
			const { id } = c.req.valid("param");

			const result = await db.query.ujian.findFirst({
				where: eq(ujian.id, id),
				with: {
					creator: {
						columns: {
							id: true,
							name: true,
							username: true,
						},
					},
					questions: {
						orderBy: (questions, { asc }) => [
							asc(questions.orderIndex),
						],
					},
				},
			});

			if (!result) {
				return notFound({ message: "Ujian not found" });
			}

			return c.json({
				...result,
				totalQuestions: result.questions.length,
			});
		},
	);

export default getUjianByIdRoute;
