import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { ujian } from "./ujian";
import { ujianAnswers } from "./ujianAnswers";

export const questionTypeEnum = pgEnum("question_type", [
	"mcq",
	"multiple_select",
	"input",
]);

type QuestionOption = {
	id: string;
	text: string;
};

export const ujianQuestions = pgTable(
	"ujian_questions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		ujianId: text("ujian_id")
			.notNull()
			.references(() => ujian.id, { onDelete: "cascade" }),
		questionText: text("question_text").notNull(),
		questionType: questionTypeEnum("question_type").notNull(),
		options: jsonb("options").$type<QuestionOption[] | null>(),
		correctAnswer: jsonb("correct_answer")
			.$type<string | string[]>()
			.notNull(),
		points: integer("points").default(1),
		orderIndex: integer("order_index").notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		ujianIdIdx: index("idx_ujian_questions_ujian_id").on(table.ujianId),
		ujianOrderIdx: index("idx_ujian_questions_order").on(
			table.ujianId,
			table.orderIndex,
		),
	}),
);

export const ujianQuestionsRelations = relations(
	ujianQuestions,
	({ one, many }) => ({
		ujian: one(ujian, {
			fields: [ujianQuestions.ujianId],
			references: [ujian.id],
		}),
		answers: many(ujianAnswers),
	}),
);
