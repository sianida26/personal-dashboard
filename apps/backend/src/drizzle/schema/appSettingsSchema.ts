import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const appSettingsSchema = pgTable("app_settings", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	key: text("key").notNull().unique(),
	value: text("value").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
