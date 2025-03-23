import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Microsoft admin token storage
 * This table stores Microsoft Graph API tokens for admin operations
 * These tokens are not associated with specific users and are used for application-level permissions
 */
export const microsoftAdminTokens = pgTable("microsoft_admin_tokens", {
	id: varchar("id", { length: 255 })
		.primaryKey()
		.$defaultFn(() => createId()),
	tokenType: varchar("token_type", { length: 50 }).notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	scope: text("scope").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});
