import { SidebarMenu } from "../types";

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
			//TODO: Add roles page and feature
			// {
			// 	label: "Roles",
			// 	icon: { tb: "TbUserCog" },
			// 	allowedPermissions: ["*"],
			// 	link: "/roles",
			// 	color: "green",
			// },
		],
	},
];

export default sidebarMenus;
