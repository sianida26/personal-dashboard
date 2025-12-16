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
	const { isAuthenticated, saveAuthData, isRefreshing, hasNoAccess } =
		useAuth();

	// Enable keyboard shortcut for emergency logout (Ctrl/Cmd+Shift+Q)
	useLogoutShortcut();

	const { error } = useQuery({
		queryKey: ["my-profile"],
		queryFn: async () => {
			try {
				const response = await fetchRPC(
					client.auth["my-profile"].$get(),
				);

				await saveAuthData({
					id: response.id,
					name: response.name,
					permissions: response.permissions,
					roles: response.roles,
				});

				return response;
			} catch (err) {
				// If we get a 401 error, the token might be expired
				// The AuthProvider will handle token refresh automatically
				throw err;
			}
		},
		enabled: isAuthenticated,
		// Don't retry on 401 errors - let the auth system handle it
		retry: (failureCount, error) => {
			if (error && typeof error === "object" && "message" in error) {
				const message = String(error.message);
				if (
					message.includes("401") ||
					message.includes("Invalid access token")
				) {
					return false;
				}
			}
			return failureCount < 1;
		},
	});

	// const [openNavbar, { toggle }] = useDisclosure(false);

	// Handle authentication errors
	if (error) {
		const errorMessage = error.message || "";
		// Check for authentication-related errors
		if (
			errorMessage.includes("401") ||
			errorMessage.includes("Invalid access token") ||
			errorMessage.includes("Unauthorized")
		) {
			// Don't redirect if we're currently refreshing - give it a chance
			if (!isRefreshing) {
				return <Navigate to="/logout" replace />;
			}
		}
	}

	// Redirect to login with current path if not authenticated and not refreshing
	if (!isAuthenticated && !isRefreshing) {
		const currentPath = window.location.pathname;
		// Don't redirect to login if we're already there
		if (currentPath === "/login") {
			return null;
		}
		return (
			<Navigate to="/login" search={{ redirect: currentPath }} replace />
		);
	}

	// Redirect to no-access page if user has no roles and no permissions
	if (isAuthenticated && hasNoAccess()) {
		return <Navigate to="/no-access" replace />;
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
	) : null;
}
