import { createQuestionSchema } from "@repo/validation";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import { ujianQuestions } from "../../drizzle/schema/ujianQuestions";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";
import { z } from "zod";
import { eq } from "drizzle-orm";

/**
 * POST /ujian/:id/questions - Add question to ujian
 */
const postUjianQuestionRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/:id/questions",
		checkPermission("ujian.update"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		requestValidator("json", createQuestionSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");

			// Check if ujian exists
			const existing = await db.query.ujian.findFirst({
				where: eq(ujian.id, id),
			});

			if (!existing) {
				return notFound({ message: "Ujian not found" });
			}

			const [newQuestion] = await db
				.insert(ujianQuestions)
				.values({
					ujianId: id,
					questionText: data.questionText,
					questionType: data.questionType,
					options: data.options || null,
					correctAnswer: data.correctAnswer,
					points: data.points || 1,
					orderIndex: data.orderIndex,
				})
				.returning();

			return c.json(newQuestion, 201);
		},
	);

export default postUjianQuestionRoute;
