export const permissions = [
	"dev-routes",
	"users.readAll",
	"users.create",
	"users.update",
	"users.delete",
	"users.restore",
	"permissions.read",
	"roles.read",
	"roles.create",
	"roles.update",
	"roles.delete",
	"app-settings.read",
	"app-settings.edit",
	"ms-graph.read",
	"observability.read",
	"observability.write",
	"observability.delete",
	"ujian.read",
	"ujian.create",
	"ujian.update",
	"ujian.delete",
	"ujian.take",
] as const;

export const generalPermissions = ["authenticated-only", "guest-only"] as const;

export type PermissionCode = (typeof permissions)[number];

export type GeneralPermissionCode = (typeof generalPermissions)[number];

export type ExtendedPermissionCode = PermissionCode | GeneralPermissionCode; // general permissions are included

export type ExtendedPermissionCodeWithAll = ExtendedPermissionCode | "*";
