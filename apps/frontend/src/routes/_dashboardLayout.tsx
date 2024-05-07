import { AppShell } from "@mantine/core";
import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { useDisclosure } from "@mantine/hooks";
import AppHeader from "../components/AppHeader";
import AppNavbar from "../components/AppNavbar";
import useAuth from "@/hooks/useAuth";

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
	const { isAuthenticated } = useAuth();

	const [openNavbar, { toggle }] = useDisclosure(false);

	return isAuthenticated ? (
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
	) : (
		<Navigate to="/login" />
	);
}
