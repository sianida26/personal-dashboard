import { PermissionCode } from "../data/permissions";

export interface SidebarMenuChildItem {
	label: string;
	link: string;
	allowedPermissions?: PermissionCode[];
}

export interface SidebarMenuItem {
	label: string;
	icon: Record<"tb", string>;
	type?: "item";
	children?: SidebarMenuChildItem[];
	link?: string;
	color?: string;
	allowedPermissions?: PermissionCode[];
}

export interface SidebarMenuGroup {
	label: string;
	type: "group";
	children: SidebarMenuItem[];
}

type SidebarMenu = SidebarMenuGroup | SidebarMenuItem;

export default SidebarMenu;
