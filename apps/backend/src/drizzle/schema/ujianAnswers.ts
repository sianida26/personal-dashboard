import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { ujianAttempts } from "./ujianAttempts";
import { ujianQuestions } from "./ujianQuestions";

export const ujianAnswers = pgTable(
	"ujian_answers",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		attemptId: text("attempt_id")
			.notNull()
			.references(() => ujianAttempts.id, { onDelete: "cascade" }),
		questionId: text("question_id")
			.notNull()
			.references(() => ujianQuestions.id),
		userAnswer: jsonb("user_answer").$type<string | string[]>().notNull(),
		isCorrect: boolean("is_correct"),
		pointsEarned: integer("points_earned").default(0),
		answeredAt: timestamp("answered_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		attemptIdx: index("idx_ujian_answers_attempt").on(table.attemptId),
		attemptQuestionIdx: index("idx_ujian_answers_attempt_question").on(
			table.attemptId,
			table.questionId,
		),
	}),
);

export const ujianAnswersRelations = relations(ujianAnswers, ({ one }) => ({
	attempt: one(ujianAttempts, {
		fields: [ujianAnswers.attemptId],
		references: [ujianAttempts.id],
	}),
	question: one(ujianQuestions, {
		fields: [ujianAnswers.questionId],
		references: [ujianQuestions.id],
	}),
}));
