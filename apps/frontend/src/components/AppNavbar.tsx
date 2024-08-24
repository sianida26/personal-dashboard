import { AppShell, ScrollArea } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import client from "../honoClient";
import MenuItem from "./NavbarMenuItem";

// import MenuItem from "./SidebarMenuItem";
// import { useAuth } from "@/modules/auth/contexts/AuthContext";

/**
 * `AppNavbar` is a React functional component that renders the application's navigation bar.
 * It utilizes data from `allMenu` to create a list of menu items displayed in a scrollable area.
 *
 * @returns A React element representing the application's navigation bar.
 */
export default function AppNavbar() {
	// const {user} = useAuth();

	const { data } = useQuery({
		queryKey: ["sidebarData"],
		queryFn: async () => {
			const res = await client.dashboard.getSidebarItems.$get();
			if (res.ok) {
				const data = await res.json();

				return data;
			}
			console.error("Error:", res.status, res.statusText);

			//TODO: Handle error properly
			throw new Error("Error fetching sidebar data");
		},
	});

	return (
		<AppShell.Navbar p="md">
			<ScrollArea style={{ flex: "1" }}>
				{data?.map((menu, i) => <MenuItem menu={menu} key={i} />)}
				{/* {user?.sidebarMenus.map((menu, i) => (
					<MenuItem menu={menu} key={i} />
				)) ?? null} */}
			</ScrollArea>
		</AppShell.Navbar>
	);
}
