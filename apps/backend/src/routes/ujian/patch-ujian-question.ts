import { updateQuestionSchema } from "@repo/validation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujianQuestions } from "../../drizzle/schema/ujianQuestions";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * PATCH /ujian/questions/:id - Update question
 */
const patchUjianQuestionRoute = createHonoRoute()
	.use(authInfo)
	.patch(
		"/questions/:id",
		checkPermission("ujian.update"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		requestValidator("json", updateQuestionSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");

			// Check if question exists
			const existing = await db.query.ujianQuestions.findFirst({
				where: eq(ujianQuestions.id, id),
			});

			if (!existing) {
				return notFound({ message: "Question not found" });
			}

			const [updated] = await db
				.update(ujianQuestions)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(ujianQuestions.id, id))
				.returning();

			return c.json(updated);
		},
	);

export default patchUjianQuestionRoute;
