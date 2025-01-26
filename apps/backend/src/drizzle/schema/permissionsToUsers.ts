import { relations } from "drizzle-orm";
import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { permissionsSchema } from "./permissions";
import { users } from "./users";

export const permissionsToUsers = pgTable(
	"permissions_to_users",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		permissionId: text("permissionId")
			.notNull()
			.references(() => permissionsSchema.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.userId, table.permissionId],
		}),
	}),
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
	}),
);
