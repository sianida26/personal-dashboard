const permissionsData = [
	{
		code: "dev-routes",
	},
	{
		code: "users.readAll",
	},
	{
		code: "users.create",
	},
	{
		code: "users.update",
	},
	{
		code: "users.delete",
	},
	{
		code: "users.restore",
	},
	{
		code: "permissions.read",
	},
	{
		code: "roles.read",
	},
	{
		code: "roles.create",
	},
	{
		code: "roles.update",
	},
	{
		code: "roles.delete",
	},
] as const;

export type SpecificPermissionCode = (typeof permissionsData)[number]["code"];

export type PermissionCode =
	| SpecificPermissionCode
	| "*"
	| "authenticated-only"
	| "guest-only";

export default permissionsData;
