import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { permissionsSchema } from "./permissions";
import { relations } from "drizzle-orm";
import { rolesSchema } from "./roles";

export const permissionsToRoles = pgTable(
	"permissions_to_roles",
	{
		roleId: text("roleId")
			.notNull()
			.references(() => rolesSchema.id, { onDelete: "cascade" }),
		permissionId: text("permissionId")
			.notNull()
			.references(() => permissionsSchema.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.roleId, table.permissionId],
		}),
	})
);

export const permissionsToRolesRelations = relations(
	permissionsToRoles,
	({ one }) => ({
		role: one(rolesSchema, {
			fields: [permissionsToRoles.roleId],
			references: [rolesSchema.id],
		}),
		permission: one(permissionsSchema, {
			fields: [permissionsToRoles.permissionId],
			references: [permissionsSchema.id],
		}),
	})
);
