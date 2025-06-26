import { useState, useEffect, type ReactNode } from "react";
import { useObservabilityToggle } from "@/hooks/useObservabilityToggle";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorFallbackProps {
	error: Error;
	resetError: () => void;
}

/**
 * Error fallback component that displays when an error occurs
 */
function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
	const handleGoHome = () => {
		window.location.href = "/";
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<div className="text-center">
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
							<svg
								className="h-6 w-6 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.958-.833-2.728 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
							Something went wrong
						</h2>
						<p className="mt-2 text-center text-sm text-gray-600">
							We've encountered an unexpected error. Our team has
							been notified and is working to fix it.
						</p>

						{/* Show error details in development */}
						{process.env.NODE_ENV === "development" && error && (
							<div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
								<h3 className="text-sm font-medium text-gray-900 mb-2">
									Error Details (Development Only)
								</h3>
								<p className="text-xs text-gray-700 font-mono break-all">
									{error.message}
								</p>
								{error.stack && (
									<details className="mt-2">
										<summary className="text-xs text-gray-600 cursor-pointer">
											Stack Trace
										</summary>
										<pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
											{error.stack}
										</pre>
									</details>
								)}
							</div>
						)}

						<div className="mt-6 flex flex-col space-y-3">
							<button
								type="button"
								onClick={resetError}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Try Again
							</button>
							<button
								type="button"
								onClick={handleGoHome}
								className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Go to Home
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Hook to report errors to the observability system
 */
function useErrorReporting() {
	const isObservabilityEnabled = useObservabilityToggle();

	// Safely try to get auth info, but don't throw if AuthProvider is not available
	let user = null;
	try {
		const authContext = useAuth();
		user = authContext.user;
	} catch {
		// useAuth hook throws when used outside AuthProvider context
		// This is expected when ErrorBoundary is rendered above AuthProvider
		// Continue without user info
	}

	const reportError = async (
		error: Error,
		errorInfo?: { componentStack?: string },
	) => {
		if (!isObservabilityEnabled) return;

		try {
			// Get current route information
			const currentRoute = window.location.pathname;
			const currentSearch = window.location.search;
			const currentHash = window.location.hash;
			const fullUrl = `${currentRoute}${currentSearch}${currentHash}`;

			// Prepare error report payload
			const errorReport = {
				eventType: "frontend_error" as const,
				errorMessage: error.message,
				stackTrace: error.stack || "",
				componentStack: errorInfo?.componentStack || undefined,
				route: fullUrl,
				metadata: {
					userAgent: navigator.userAgent,
					url: window.location.href,
					userId: user?.id || null,
					userName: user?.name || null,
					errorName: error.name,
					cause: error.cause ? String(error.cause) : null,
					timestamp: new Date().toISOString(),
				},
			};

			// Send error report to backend
			const response = await client.observability.frontend.$post({
				json: errorReport,
			});

			if (!response.ok) {
				console.warn(
					"Failed to report error to observability system:",
					response.status,
				);
			}
		} catch (reportError) {
			// Don't throw errors when reporting fails - this could cause infinite loops
			console.warn(
				"Failed to report error to observability system:",
				reportError,
			);
		}
	};

	return { reportError };
}

/**
 * Functional Error Boundary component using modern React patterns
 */
export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
	const [error, setError] = useState<Error | null>(null);
	const { reportError } = useErrorReporting();

	// Reset error when children change
	useEffect(() => {
		setError(null);
	}, [children]);

	// Global error handler for unhandled promise rejections and errors
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			const newError = new Error(event.message);
			setError(newError);
			reportError(newError);
		};

		const handlePromiseRejection = (event: PromiseRejectionEvent) => {
			const newError = new Error(
				event.reason?.message || "Unhandled promise rejection",
			);
			setError(newError);
			reportError(newError);
		};

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handlePromiseRejection);

		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener(
				"unhandledrejection",
				handlePromiseRejection,
			);
		};
	}, [reportError]);

	if (error) {
		return (
			<ErrorFallback error={error} resetError={() => setError(null)} />
		);
	}

	return <>{children}</>;
}
