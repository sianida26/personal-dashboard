import { ExtendedPermissionCode, permissions } from "@repo/data";

export type Role = {
	code: RoleCode;
	description: string;
	isActive: boolean;
	name: string;
	permissions: readonly ExtendedPermissionCode[];
};

const defaultRoles: Role[] = [
	{
		code: "super-admin",
		description:
			"Has full access to the system and can manage all features and settings",
		isActive: true,
		name: "Super Admin",
		permissions: permissions,
	},
];

export type RoleCode = "super-admin" | "*";

export default defaultRoles;
