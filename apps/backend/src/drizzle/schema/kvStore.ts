import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const kvStore = pgTable("kv_store", {
	key: text("key").primaryKey(),
	value: text("value"),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}),
});