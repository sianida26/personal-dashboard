import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	decimal,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { ujian } from "./ujian";
import { ujianAnswers } from "./ujianAnswers";
import { users } from "./users";

export const attemptStatusEnum = pgEnum("attempt_status", [
	"in_progress",
	"completed",
	"abandoned",
]);

export const ujianAttempts = pgTable(
	"ujian_attempts",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		ujianId: text("ujian_id")
			.notNull()
			.references(() => ujian.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		startedAt: timestamp("started_at", { mode: "date" }).defaultNow(),
		completedAt: timestamp("completed_at", { mode: "date" }),
		score: decimal("score", { precision: 5, scale: 2 }),
		totalPoints: integer("total_points"),
		status: attemptStatusEnum("status").notNull().default("in_progress"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		userUjianIdx: index("idx_ujian_attempts_user_ujian").on(
			table.userId,
			table.ujianId,
		),
		statusIdx: index("idx_ujian_attempts_status").on(table.status),
	}),
);

export const ujianAttemptsRelations = relations(
	ujianAttempts,
	({ one, many }) => ({
		ujian: one(ujian, {
			fields: [ujianAttempts.ujianId],
			references: [ujian.id],
		}),
		user: one(users, {
			fields: [ujianAttempts.userId],
			references: [users.id],
		}),
		answers: many(ujianAnswers),
	}),
);
