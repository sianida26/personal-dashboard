import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

import { AuthProvider } from "./contexts/Auth/AuthProvider";
import { NotificationProvider } from "./contexts/Notification/NotificationProvider";
import { AppProvider } from "./contexts/App/AppContext";
import { usePerformanceMonitor } from "./hooks/usePerformanceMonitor";
import { useConsoleLogger } from "./hooks/useConsoleLogger";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,
		},
	},
});

const router = createRouter({
	routeTree,
	context: { queryClient, pageTitle: "" },
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

/**
 * Performance monitoring component that initializes performance tracking
 */
function PerformanceMonitor() {
	usePerformanceMonitor();
	return null;
}

/**
 * Console logger component that captures frontend logs
 */
function ConsoleLogger() {
	useConsoleLogger();
	return null;
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AppProvider>
				<AuthProvider>
					<NotificationProvider>
						<PerformanceMonitor />
						<ConsoleLogger />
						<RouterProvider router={router} />
					</NotificationProvider>
				</AuthProvider>
			</AppProvider>
		</QueryClientProvider>
	);
}

export default App;
