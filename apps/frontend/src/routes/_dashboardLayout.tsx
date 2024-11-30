import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import useAuth from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import fetchRPC from "@/utils/fetchRPC";
import client from "@/honoClient";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";

export const Route = createFileRoute("/_dashboardLayout")({
	component: DashboardLayout,
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

	// const [openNavbar, { toggle }] = useDisclosure(false);

	if (error && error.message === "Invalid access token signature") {
		return <Navigate to="/logout" />;
	}

	return isAuthenticated ? (
		// App Shell
		<SidebarProvider>
			<div className="w-screen h-screen flex">
				{/* Sidebar */}
				<AppSidebar />

				{/* Right Side */}
				<div className="w-full">
					{/* Header */}
					<AppHeader />

					{/* Main Content */}
					<div className="p-4">
						<Outlet />
					</div>
				</div>
			</div>
		</SidebarProvider>
	) : (
		<Navigate to="/login" />
	);
}
