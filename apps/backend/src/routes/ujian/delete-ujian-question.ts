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
 * DELETE /ujian/questions/:id - Delete question
 */
const deleteUjianQuestionRoute = createHonoRoute()
	.use(authInfo)
	.delete(
		"/questions/:id",
		checkPermission("ujian.delete"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (c) => {
			const { id } = c.req.valid("param");

			// Check if question exists
			const existing = await db.query.ujianQuestions.findFirst({
				where: eq(ujianQuestions.id, id),
			});

			if (!existing) {
				return notFound({ message: "Question not found" });
			}

			await db.delete(ujianQuestions).where(eq(ujianQuestions.id, id));

			return c.json({ message: "Question deleted successfully" });
		},
	);

export default deleteUjianQuestionRoute;
