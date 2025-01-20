import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";

import { AuthProvider } from "./contexts/Auth/AuthProvider";
import { NotificationProvider } from "./contexts/Notification/NotificationProvider";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,
		},
	},
});

const router = createRouter({
	routeTree,
	context: { queryClient: queryClient, pageTitle: "" },
	defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}

	interface StaticDataRouteOption {
		title?: string;
	}
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<NotificationProvider>
					<RouterProvider router={router} />
				</NotificationProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
