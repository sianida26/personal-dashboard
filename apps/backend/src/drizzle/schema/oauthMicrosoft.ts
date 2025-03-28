import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
export const oauthMicrosoft = pgTable("oauth_microsoft", {
	id: varchar("id", { length: 25 })
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id").references(() => users.id),
	providerId: varchar("provider_id", { length: 255 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	email: text("email"),
	displayName: text("display_name"),
	givenName: text("given_name"),
	surname: text("surname"),
	userPrincipalName: text("user_principal_name"),
	jobTitle: text("job_title"),
	mobilePhone: text("mobile_phone"),
	officeLocation: text("office_location"),
	preferredLanguage: varchar("preferred_language", { length: 255 }),
	profilePictureUrl: text("profile_picture_url"),
	expiresAt: timestamp("expires_at", { mode: "date" }),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const oauthMicrosoftRelations = relations(oauthMicrosoft, ({ one }) => ({
	user: one(users, {
		fields: [oauthMicrosoft.userId],
		references: [users.id],
	}),
}));
