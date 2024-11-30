import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { useDisclosure } from "@mantine/hooks";
import AppHeader from "../components/AppHeader";
import AppNavbar from "../components/AppNavbar";
import useAuth from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import fetchRPC from "@/utils/fetchRPC";
import client from "@/honoClient";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

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
	const { isAuthenticated, saveAuthData } = useAuth();

	const { error } = useQuery({
		queryKey: ["my-profile"],
		queryFn: async () => {
			const response = await fetchRPC(client.auth["my-profile"].$get());

			saveAuthData({
				id: response.id,
				name: response.name,
				permissions: response.permissions,
			});

			return response;
		},
		enabled: isAuthenticated,
	});

	const [openNavbar, { toggle }] = useDisclosure(false);

	if (error && error.message === "Invalid access token signature") {
		return <Navigate to="/logout" />;
	}

	return isAuthenticated ? (
		// App Shell
		<SidebarProvider>
			<div className="bg-red-500 w-screen h-screen">
				{/* Sidebar */}
				<AppSidebar />

				{/* Right Side */}
				<div>
					{/* Header */}
					<div>
						<SidebarTrigger />
					</div>

					{/* Main Content */}
					<Outlet />
				</div>
			</div>
		</SidebarProvider>
	) : (
		<Navigate to="/login" />
	);
}
