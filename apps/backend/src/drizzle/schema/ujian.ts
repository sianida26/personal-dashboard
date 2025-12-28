import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { ujianAttempts } from "./ujianAttempts";
import { ujianQuestions } from "./ujianQuestions";
import { users } from "./users";

export const ujian = pgTable(
	"ujian",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		title: varchar("title", { length: 255 }).notNull(),
		description: text("description"),
		maxQuestions: integer("max_questions").notNull().default(10),
		shuffleQuestions: boolean("shuffle_questions").default(false),
		shuffleAnswers: boolean("shuffle_answers").default(false),
		practiceMode: boolean("practice_mode").default(false),
		allowResubmit: boolean("allow_resubmit").default(false),
		isActive: boolean("is_active").default(true),
		createdBy: text("created_by").references(() => users.id),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		activeIdx: index("idx_ujian_active").on(table.isActive),
		createdByIdx: index("idx_ujian_created_by").on(table.createdBy),
	}),
);

export const ujianRelations = relations(ujian, ({ one, many }) => ({
	creator: one(users, {
		fields: [ujian.createdBy],
		references: [users.id],
	}),
	questions: many(ujianQuestions),
	attempts: many(ujianAttempts),
}));
