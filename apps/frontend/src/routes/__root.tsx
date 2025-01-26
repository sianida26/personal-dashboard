import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

interface RouteContext {
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
