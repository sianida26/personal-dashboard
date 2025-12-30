import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { submitAnswerSchema } from "@repo/validation";
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
			// Case-insensitive string comparison for input type
			const userStr = String(userAnswer).toLowerCase().trim();
			const correctStr = String(correctAnswer).toLowerCase().trim();
			return userStr === correctStr;

		default:
			return false;
	}
};

/**
 * POST /ujian/attempts/:id/answer - Submit an answer for a question
 * In practice mode, returns whether the answer is correct
 */
const postSubmitAnswerRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/attempts/:id/answer",
		checkPermission("ujian.take"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		requestValidator("json", submitAnswerSchema),
		async (c) => {
			const uid = c.get("uid");
			const { id: attemptId } = c.req.valid("param");
			const { questionId, userAnswer } = c.req.valid("json");

			if (!uid) {
				return unauthorized();
			}

			// Get the attempt with ujian details
			const attempt = await db.query.ujianAttempts.findFirst({
				where: eq(ujianAttempts.id, attemptId),
				with: {
					ujian: true,
				},
			});

			if (!attempt) {
				return notFound({ message: "Attempt not found" });
			}

			// Verify the attempt belongs to the user
			if (attempt.userId !== uid) {
				return forbidden({
					message: "You are not authorized to submit answers for this attempt",
				});
			}

			// Check if attempt is still in progress
			if (attempt.status !== "in_progress") {
				return badRequest({
					message: "This attempt has already been completed",
				});
			}

			// Get the question
			const question = await db.query.ujianQuestions.findFirst({
				where: and(
					eq(ujianQuestions.id, questionId),
					eq(ujianQuestions.ujianId, attempt.ujianId),
				),
			});

			if (!question) {
				return notFound({
					message: "Question not found in this ujian",
				});
			}

			// Check if answer already exists
			const existingAnswer = await db.query.ujianAnswers.findFirst({
				where: and(
					eq(ujianAnswers.attemptId, attemptId),
					eq(ujianAnswers.questionId, questionId),
				),
			});

			// If in practice mode and already answered, don't allow resubmission
			if (existingAnswer && attempt.ujian.practiceMode) {
				return badRequest({
					message:
						"You have already answered this question. In practice mode, you cannot change your answer.",
				});
			}

			// Check if answer is correct
			const isCorrect = checkAnswer(
				question.questionType,
				userAnswer,
				question.correctAnswer,
			);
			const pointsEarned = isCorrect ? (question.points ?? 1) : 0;

			let savedAnswerResult;

			if (existingAnswer) {
				// Update existing answer
				savedAnswerResult = await db
					.update(ujianAnswers)
					.set({
						userAnswer,
						isCorrect,
						pointsEarned,
						answeredAt: new Date(),
					})
					.where(eq(ujianAnswers.id, existingAnswer.id))
					.returning();
			} else {
				// Insert new answer
				savedAnswerResult = await db
					.insert(ujianAnswers)
					.values({
						attemptId,
						questionId,
						userAnswer,
						isCorrect,
						pointsEarned,
					})
					.returning();
			}

			const savedAnswer = savedAnswerResult[0];
			if (!savedAnswer) {
				return badRequest({
					message: "Failed to save answer",
				});
			}

			// Build response based on practice mode
			if (attempt.ujian.practiceMode) {
				return c.json({
					answerId: savedAnswer.id,
					isCorrect,
					pointsEarned,
					correctAnswer: question.correctAnswer,
					message: isCorrect
						? "Correct!"
						: "Incorrect. The correct answer has been shown.",
				});
			}

			return c.json({
				answerId: savedAnswer.id,
				message: "Answer saved",
			});
		},
	);

export default postSubmitAnswerRoute;
