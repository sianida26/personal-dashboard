import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export interface RouteContext {
	queryClient: QueryClient;
	pageTitle?: string;
}

export const Route = createRootRouteWithContext<RouteContext>()({
	component: () => (
		<div className="font-manrope">
			<Outlet />
		</div>
	),
});
