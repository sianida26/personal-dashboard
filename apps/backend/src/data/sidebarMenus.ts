import type { SidebarMenu } from "../types";

const sidebarMenus: SidebarMenu[] = [
	{
		label: "Dashboard",
		icon: { tb: "TbLayoutDashboard" },
		allowedPermissions: ["*"],
		link: "/dashboard",
	},

	{
		label: "User Administration",
		type: "group",
		children: [
			{
				label: "Users",
				icon: { tb: "TbUsers" },
				allowedPermissions: ["permissions.read"],
				link: "/users",
				color: "red",
			},
			{
				label: "Roles",
				icon: { tb: "TbUserCog" },
				allowedPermissions: ["*"],
				link: "/roles",
				color: "green",
			},
		],
	},
	{
		label: "System",
		type: "group",
		children: [
			{
				label: "App Settings",
				icon: { tb: "TbSettings" },
				allowedPermissions: ["app-settings.read"],
				link: "/app-settings",
				color: "blue",
			},
			{
				label: "Microsoft Graph Admin",
				icon: { tb: "TbChartBar" },
				allowedPermissions: ["ms-graph.read"],
				link: "/graph-admin",
				color: "purple",
			},
		],
	},
];

export default sidebarMenus;
