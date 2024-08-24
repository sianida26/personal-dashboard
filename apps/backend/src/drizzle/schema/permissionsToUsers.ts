import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { permissionsSchema } from "./permissions";
import { relations } from "drizzle-orm";

export const permissionsToUsers = pgTable(
	"permissions_to_users",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id),
		permissionId: text("permissionId")
			.notNull()
			.references(() => permissionsSchema.id),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.userId, table.permissionId],
		}),
	})
);

export const permissionsToUsersRelations = relations(
	permissionsToUsers,
	({ one }) => ({
		user: one(users, {
			fields: [permissionsToUsers.userId],
			references: [users.id],
		}),
		permission: one(permissionsSchema, {
			fields: [permissionsToUsers.permissionId],
			references: [permissionsSchema.id],
		}),
	})
);
