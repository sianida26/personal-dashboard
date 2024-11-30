import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

interface RouteContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouteContext>()({
	component: () => (
		<div className="font-manrope">
			<Outlet />
		</div>
	),
});
