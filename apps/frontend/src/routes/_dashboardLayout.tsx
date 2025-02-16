import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";
import { SidebarProvider } from "@repo/ui/hooks";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";

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
				roles: response.roles,
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
				<div className="w-full h-full">
					{/* Header */}
					<AppHeader />

					{/* Main Content */}
					<div className="h-full pt-16">
						<Outlet />
					</div>
				</div>
			</div>
		</SidebarProvider>
	) : (
		<Navigate to="/login" />
	);
}
