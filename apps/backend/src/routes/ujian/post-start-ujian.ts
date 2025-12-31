import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import { ujianAttempts } from "../../drizzle/schema/ujianAttempts";
import { ujianQuestions } from "../../drizzle/schema/ujianQuestions";
import { badRequest, notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * POST /ujian/:id/start - Start an ujian attempt
 * Creates a new attempt and returns questions (shuffled if configured)
 */
const postStartUjianRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/:id/start",
		checkPermission("ujian.take"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (c) => {
			const uid = c.get("uid");
			const { id: ujianId } = c.req.valid("param");

			if (!uid) {
				return unauthorized();
			}

			// Get the ujian with its questions
			const ujianData = await db.query.ujian.findFirst({
				where: and(eq(ujian.id, ujianId), eq(ujian.isActive, true)),
				with: {
					questions: {
						orderBy: (questions, { asc }) => [
							asc(questions.orderIndex),
						],
					},
				},
			});

			if (!ujianData) {
				return notFound({ message: "Ujian not found or inactive" });
			}

			// Check if user has an in-progress attempt
			const existingInProgressAttempt =
				await db.query.ujianAttempts.findFirst({
					where: and(
						eq(ujianAttempts.ujianId, ujianId),
						eq(ujianAttempts.userId, uid),
						eq(ujianAttempts.status, "in_progress"),
					),
					with: {
						answers: {
							with: {
								question: true,
							},
						},
					},
				});

			// If there's an existing in-progress attempt, resume it
			if (existingInProgressAttempt) {
				// Get all questions for this ujian and filter based on stored selection
				let questions = ujianData.questions;

				// Apply max questions limit if needed
				if (questions.length > ujianData.maxQuestions) {
					// For resuming, we need to maintain the same question set
					// Get the question IDs that were already answered
					const answeredQuestionIds =
						existingInProgressAttempt.answers.map(
							(a) => a.questionId,
						);

					// If we have all questions from a previous selection, use those
					if (answeredQuestionIds.length > 0) {
						// Get answered questions plus remaining questions up to maxQuestions
						const answeredQuestions = questions.filter((q) =>
							answeredQuestionIds.includes(q.id),
						);
						const unansweredQuestions = questions.filter(
							(q) => !answeredQuestionIds.includes(q.id),
						);

						const remainingSlots =
							ujianData.maxQuestions - answeredQuestions.length;
						questions = [
							...answeredQuestions,
							...unansweredQuestions.slice(0, remainingSlots),
						];
					} else {
						// Random selection for new attempt
						questions = questions
							.sort(() => Math.random() - 0.5)
							.slice(0, ujianData.maxQuestions);
					}
				}

				// Apply shuffle if configured
				if (ujianData.shuffleQuestions) {
					questions = [...questions].sort(() => Math.random() - 0.5);
				}

				// Remove correct answers from response
			const sanitizedQuestions = questions.map((q) => {
				const existingAnswer = existingInProgressAttempt.answers.find(
					(a) => a.questionId === q.id,
				);
				
				return {
					id: q.id,
					questionText: q.questionText,
					questionType: q.questionType,
					options: ujianData.shuffleAnswers
						? q.options
							? [...q.options].sort(() => Math.random() - 0.5)
							: null
						: q.options,
					points: q.points,
					orderIndex: q.orderIndex,
					userAnswer: existingAnswer?.userAnswer,
					// Include answer feedback for practice mode
					...(ujianData.practiceMode && existingAnswer ? {
						isCorrect: existingAnswer.isCorrect,
						correctAnswer: q.correctAnswer,
					} : {}),
				};
			});
				return c.json({
					attemptId: existingInProgressAttempt.id,
					ujian: {
						id: ujianData.id,
						title: ujianData.title,
						description: ujianData.description,
						practiceMode: ujianData.practiceMode,
					},
					questions: sanitizedQuestions,
					isResuming: true,
				});
			}

			// Check if user has completed attempt and can't resubmit
			const completedAttempt = await db.query.ujianAttempts.findFirst({
				where: and(
					eq(ujianAttempts.ujianId, ujianId),
					eq(ujianAttempts.userId, uid),
					eq(ujianAttempts.status, "completed"),
				),
			});

			if (completedAttempt && !ujianData.allowResubmit) {
				return badRequest({
					message:
						"You have already completed this ujian and resubmit is not allowed",
				});
			}

			// Create new attempt
			const newAttemptResult = await db
				.insert(ujianAttempts)
				.values({
					ujianId,
					userId: uid,
				})
				.returning();

			const newAttempt = newAttemptResult[0];
			if (!newAttempt) {
				return badRequest({
					message: "Failed to create attempt",
				});
			}

			// Select questions based on maxQuestions
			let questions = ujianData.questions;

			// Random selection if more questions than maxQuestions
			if (questions.length > ujianData.maxQuestions) {
				questions = questions
					.sort(() => Math.random() - 0.5)
					.slice(0, ujianData.maxQuestions);
			}

			// Apply shuffle if configured
			if (ujianData.shuffleQuestions) {
				questions = [...questions].sort(() => Math.random() - 0.5);
			}

			// Remove correct answers from response
			const sanitizedQuestions = questions.map((q) => ({
				id: q.id,
				questionText: q.questionText,
				questionType: q.questionType,
				options: ujianData.shuffleAnswers
					? q.options
						? [...q.options].sort(() => Math.random() - 0.5)
						: null
					: q.options,
				points: q.points,
				orderIndex: q.orderIndex,
			}));

			return c.json(
				{
					attemptId: newAttempt.id,
					ujian: {
						id: ujianData.id,
						title: ujianData.title,
						description: ujianData.description,
						practiceMode: ujianData.practiceMode,
					},
					questions: sanitizedQuestions,
					isResuming: false,
				},
				201,
			);
		},
	);

export default postStartUjianRoute;
