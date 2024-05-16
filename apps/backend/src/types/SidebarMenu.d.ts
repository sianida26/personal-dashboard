import { PermissionCode } from "../data/permissions";

interface SidebarMenu {
	label: string;
	icon: Record<"tb", string>;
	children?: {
		label: string;
		link: string;
		allowedPermissions?: PermissionCode[];
	}[];
	link?: string;
	color?: string;
	allowedPermissions?: PermissionCode[];
}

export default SidebarMenu;
