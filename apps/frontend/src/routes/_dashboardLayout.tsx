import { AppShell } from "@mantine/core";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDisclosure } from "@mantine/hooks";
import AppHeader from "../components/AppHeader";
import AppNavbar from "../components/AppNavbar";
import isAuthenticated from "@/utils/isAuthenticated";
import { useEffect } from "react";

export const Route = createFileRoute("/_dashboardLayout")({
	component: DashboardLayout,

	// beforeLoad: ({ location }) => {
	// 	if (true) {
	// 		throw redirect({
	// 			to: "/login",
	// 		});
	// 	}
	// },
});

function DashboardLayout() {
	const [openNavbar, { toggle }] = useDisclosure(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (!isAuthenticated()) {
			navigate({ to: "/login", replace: true });
		}
	}, [navigate]);

	return (
		<AppShell
			padding="md"
			header={{ height: 70 }}
			navbar={{
				width: 300,
				breakpoint: "sm",
				collapsed: { mobile: !openNavbar },
			}}
		>
			<AppHeader openNavbar={openNavbar} toggle={toggle} />

			<AppNavbar />

			<AppShell.Main
				className="bg-slate-100"
				styles={{ main: { backgroundColor: "rgb(241 245 249)" } }}
			>
				<Outlet />
			</AppShell.Main>
		</AppShell>
	);
}
