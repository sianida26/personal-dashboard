import { and, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujianAnswers } from "../../drizzle/schema/ujianAnswers";
import { ujianAttempts } from "../../drizzle/schema/ujianAttempts";
import { forbidden, notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /ujian/attempts/:id/results - Get results for a completed attempt
 * Returns detailed results including all answers and correct answers
 */
const getAttemptResultsRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/attempts/:id/results",
		checkPermission("ujian.take"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (c) => {
			const uid = c.get("uid");
			const { id: attemptId } = c.req.valid("param");

			if (!uid) {
				return unauthorized();
			}

			// Get the attempt with all details
			const attempt = await db.query.ujianAttempts.findFirst({
				where: eq(ujianAttempts.id, attemptId),
				with: {
					ujian: {
						columns: {
							id: true,
							title: true,
							description: true,
							practiceMode: true,
						},
					},
					answers: {
						with: {
							question: true,
						},
						orderBy: (answers, { asc }) => [asc(answers.answeredAt)],
					},
				},
			});

			if (!attempt) {
				return notFound({ message: "Attempt not found" });
			}

			// Verify the attempt belongs to the user
			if (attempt.userId !== uid) {
				return forbidden({
					message: "You are not authorized to view this attempt",
				});
			}

			// Format the response
			const results = {
				attemptId: attempt.id,
				status: attempt.status,
				startedAt: attempt.startedAt,
				completedAt: attempt.completedAt,
				score: attempt.score ? Number.parseFloat(attempt.score) : null,
				totalPoints: attempt.totalPoints,
				ujian: attempt.ujian,
				answers: attempt.answers.map((a) => ({
					questionId: a.questionId,
					questionText: a.question?.questionText,
					questionType: a.question?.questionType,
					options: a.question?.options,
					userAnswer: a.userAnswer,
					correctAnswer:
						attempt.status === "completed"
							? a.question?.correctAnswer
							: undefined,
					isCorrect: a.isCorrect,
					pointsEarned: a.pointsEarned,
					maxPoints: a.question?.points ?? 1,
					answeredAt: a.answeredAt,
				})),
				summary:
					attempt.status === "completed"
						? {
								totalQuestions: attempt.answers.length,
								correctAnswers: attempt.answers.filter(
									(a) => a.isCorrect,
								).length,
								incorrectAnswers: attempt.answers.filter(
									(a) => !a.isCorrect,
								).length,
								totalPointsEarned: attempt.answers.reduce(
									(sum, a) => sum + (a.pointsEarned ?? 0),
									0,
								),
							}
						: null,
			};

			return c.json(results);
		},
	);

export default getAttemptResultsRoute;
