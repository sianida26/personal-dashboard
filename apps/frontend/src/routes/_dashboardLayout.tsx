import { SidebarInset } from "@repo/ui";
import { SidebarProvider } from "@repo/ui/hooks";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

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
		<SidebarProvider className="flex min-h-screen w-screen">
			<AppSidebar />
			<SidebarInset className="relative flex flex-1 flex-col">
				<AppHeader />
				<div className="flex-1 overflow-auto">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	) : (
		<Navigate to="/login" />
	);
}
