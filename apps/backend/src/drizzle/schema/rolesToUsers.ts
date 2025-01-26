import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";
import { rolesSchema } from "./roles";

export const rolesToUsers = pgTable(
	"roles_to_users",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: text("roleId")
			.notNull()
			.references(() => rolesSchema.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.userId, table.roleId],
		}),
	})
);

export const rolesToUsersRelations = relations(rolesToUsers, ({ one }) => ({
	user: one(users, {
		fields: [rolesToUsers.userId],
		references: [users.id],
	}),
	role: one(rolesSchema, {
		fields: [rolesToUsers.roleId],
		references: [rolesSchema.id],
	}),
}));
