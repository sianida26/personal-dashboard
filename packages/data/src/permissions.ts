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
	// Observability permissions
	"projects.read",
	"projects.create",
	"projects.update",
	"projects.delete",
	"projects.members.read",
	"projects.members.manage",
	"traces.read",
	"traces.write",
	"metrics.read",
	"metrics.write",
	"logs.read",
	"logs.write",
	"errors.read",
	"errors.write",
	"errors.resolve",
	"dashboards.read",
	"dashboards.create",
	"dashboards.update",
	"dashboards.delete",
	"analytics.read",
] as const;

export const generalPermissions = ["authenticated-only", "guest-only"] as const;

export type PermissionCode = (typeof permissions)[number];

export type GeneralPermissionCode = (typeof generalPermissions)[number];

export type ExtendedPermissionCode = PermissionCode | GeneralPermissionCode; // general permissions are included

export type ExtendedPermissionCodeWithAll = ExtendedPermissionCode | "*";
