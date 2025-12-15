import { SidebarInset } from "@repo/ui";
import { SidebarProvider } from "@repo/ui/hooks";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SidebarErrorBoundary from "@/components/SidebarErrorBoundary";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import { useLogoutShortcut } from "@/hooks/useLogoutShortcut";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout")({
	component: DashboardLayout,
});

function DashboardLayout() {
	const { isAuthenticated, saveAuthData, isRefreshing } = useAuth();

	// Enable keyboard shortcut for emergency logout (Ctrl/Cmd+Shift+Q)
	useLogoutShortcut();

	const { error } = useQuery({
		queryKey: ["my-profile"],
		queryFn: async () => {
			const response = await fetchRPC(client.auth["my-profile"].$get());

			await saveAuthData({
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

	// During token refresh, maintain current state to prevent flicker
	return isAuthenticated || isRefreshing ? (
		// App Shell
		<SidebarProvider className="flex h-screen w-full overflow-hidden">
			<SidebarErrorBoundary>
				<AppSidebar />
			</SidebarErrorBoundary>
			<SidebarInset className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
				<AppHeader />
				<main className="flex-1 min-h-0 overflow-hidden">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	) : (
		<Navigate to="/login" />
	);
}
