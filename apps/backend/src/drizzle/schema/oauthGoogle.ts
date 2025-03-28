import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const oauthGoogle = pgTable("oauth_google", {
	id: varchar("id", { length: 25 })
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id").references(() => users.id),
	providerId: varchar("provider_id", { length: 255 }).notNull(),
	name: text("name"),
	givenName: text("given_name"),
	familyName: text("family_name"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	locale: varchar("locale", { length: 255 }),
	email: text("email"),
	profilePictureUrl: text("profile_picture_url"),
	expiresAt: timestamp("expires_at", { mode: "date" }),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const oauthGoogleRelations = relations(oauthGoogle, ({ one }) => ({
	user: one(users, {
		fields: [oauthGoogle.userId],
		references: [users.id],
	}),
}));
