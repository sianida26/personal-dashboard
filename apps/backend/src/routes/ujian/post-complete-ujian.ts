import { and, eq, sum } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujianAnswers } from "../../drizzle/schema/ujianAnswers";
import { ujianAttempts } from "../../drizzle/schema/ujianAttempts";
import { ujianQuestions } from "../../drizzle/schema/ujianQuestions";
import {
	badRequest,
	forbidden,
	notFound,
	unauthorized,
} from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * Checks if the user's answer is correct based on question type
 */
const checkAnswer = (
	questionType: "mcq" | "multiple_select" | "input",
	userAnswer: string | string[],
	correctAnswer: string | string[],
): boolean => {
	switch (questionType) {
		case "mcq":
			return userAnswer === correctAnswer;

		case "multiple_select":
			if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
				return false;
			}
			const sortedUser = [...userAnswer].sort();
			const sortedCorrect = [...correctAnswer].sort();
			return (
				sortedUser.length === sortedCorrect.length &&
				sortedUser.every((val, idx) => val === sortedCorrect[idx])
			);

		case "input":
			const userStr = String(userAnswer).toLowerCase().trim();
			const correctStr = String(correctAnswer).toLowerCase().trim();
			return userStr === correctStr;

		default:
			return false;
	}
};

/**
 * POST /ujian/attempts/:id/complete - Complete an ujian attempt
 * Calculates final score and marks attempt as completed
 */
const postCompleteUjianRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/attempts/:id/complete",
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

			// Get the attempt with all answers
			const attempt = await db.query.ujianAttempts.findFirst({
				where: eq(ujianAttempts.id, attemptId),
				with: {
					ujian: true,
					answers: {
						with: {
							question: true,
						},
					},
				},
			});

			if (!attempt) {
				return notFound({ message: "Attempt not found" });
			}

			// Verify the attempt belongs to the user
			if (attempt.userId !== uid) {
				return forbidden({
					message:
						"You are not authorized to complete this attempt",
				});
			}

			// Check if attempt is still in progress
			if (attempt.status !== "in_progress") {
				return badRequest({
					message: "This attempt has already been completed",
				});
			}

			// Get all questions for this ujian
			const allQuestions = await db.query.ujianQuestions.findMany({
				where: eq(ujianQuestions.ujianId, attempt.ujianId),
			});

			// Calculate total points possible (limited by maxQuestions)
			const questionsToConsider = allQuestions
				.slice(0, attempt.ujian.maxQuestions)
				.map((q) => q.id);

			const totalPoints = allQuestions
				.filter((q) => questionsToConsider.includes(q.id))
				.reduce((sum, q) => sum + (q.points ?? 1), 0);

			// Re-check all answers to ensure correctness is accurate
			let totalPointsEarned = 0;

			for (const answer of attempt.answers) {
				const question = answer.question;
				if (!question) continue;

				const isCorrect = checkAnswer(
					question.questionType,
					answer.userAnswer,
					question.correctAnswer,
				);
				const pointsEarned = isCorrect ? (question.points ?? 1) : 0;
				totalPointsEarned += pointsEarned;

				// Update answer with correct values
				await db
					.update(ujianAnswers)
					.set({
						isCorrect,
						pointsEarned,
					})
					.where(eq(ujianAnswers.id, answer.id));
			}

			// Calculate score percentage
			const score =
				totalPoints > 0
					? Math.round((totalPointsEarned / totalPoints) * 10000) / 100
					: 0;

			// Update attempt status
			const [updatedAttempt] = await db
				.update(ujianAttempts)
				.set({
					status: "completed",
					completedAt: new Date(),
					score: String(score),
					totalPoints,
				})
				.where(eq(ujianAttempts.id, attemptId))
				.returning();

			return c.json({
				message: "Ujian completed successfully",
				attemptId,
				score,
				totalPointsEarned,
				totalPoints,
				totalQuestions: attempt.answers.length,
				correctAnswers: attempt.answers.filter(
					(a) =>
						checkAnswer(
							a.question!.questionType,
							a.userAnswer,
							a.question!.correctAnswer,
						),
				).length,
			});
		},
	);

export default postCompleteUjianRoute;
