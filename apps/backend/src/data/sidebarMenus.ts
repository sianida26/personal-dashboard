import { SidebarMenu } from "../types";

const sidebarMenus: SidebarMenu[] = [
	{
		label: "Dashboard",
		icon: { tb: "TbLayoutDashboard" },
		allowedPermissions: ["*"],
		link: "/",
	},
	{
		label: "Users",
		icon: { tb: "TbUsers" },
		allowedPermissions: ["permissions.read"],
		link: "/users",
		color: "red",
	},
];

export default sidebarMenus;
