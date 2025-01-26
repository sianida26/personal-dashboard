import type { ExtendedPermissionCodeWithAll } from "@repo/data";

export interface SidebarMenuChildItem {
	label: string;
	link: string;
	allowedPermissions?: readonly ExtendedPermissionCodeWithAll[];
}

export interface SidebarMenuItem {
	label: string;
	icon: Record<"tb", string>;
	type?: "item";
	children?: SidebarMenuChildItem[];
	link?: string;
	color?: string;
	allowedPermissions?: readonly ExtendedPermissionCodeWithAll[];
}

export interface SidebarMenuGroup {
	label: string;
	type: "group";
	children: SidebarMenuItem[];
}

type SidebarMenu = SidebarMenuGroup | SidebarMenuItem;

export default SidebarMenu;
