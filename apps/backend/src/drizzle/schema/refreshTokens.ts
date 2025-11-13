import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const refreshTokens = pgTable("refresh_tokens", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	revokedAt: timestamp("revoked_at", { mode: "date" }),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id],
	}),
}));
