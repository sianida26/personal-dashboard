import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { permissionsToUsers } from "./permissionsToUsers";
import { rolesToUsers } from "./rolesToUsers";
import { oauthGoogle } from "./oauthGoogle";
import { oauthMicrosoft } from "./oauthMicrosoft";
import { refreshTokens } from "./refreshTokens";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: varchar("name", { length: 255 }).notNull(),
	username: varchar("username").notNull().unique(),
	email: varchar("email"),
	phoneNumber: varchar("phone_number", { length: 20 }),
	password: text("password"),
	isEnabled: boolean("is_enable").default(true),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const usersRelations = relations(users, ({ many, one }) => ({
	permissionsToUsers: many(permissionsToUsers),
	rolesToUsers: many(rolesToUsers),
	oauthGoogle: one(oauthGoogle, {
		fields: [users.id],
		references: [oauthGoogle.userId],
	}),
	oauthMicrosoft: one(oauthMicrosoft, {
		fields: [users.id],
		references: [oauthMicrosoft.userId],
	}),
	refreshTokens: many(refreshTokens),
}));
