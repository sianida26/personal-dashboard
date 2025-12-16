import { type ReactNode, useEffect, useState } from "react";
import { trackError } from "@/lib/telemetry";

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
 * Functional Error Boundary component using modern React patterns
 */
export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
	const [error, setError] = useState<Error | null>(null);

	// Reset error when children change
	useEffect(() => {
		setError(null);
	}, [children]);

	// Global error handler for unhandled promise rejections and errors
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			const newError = new Error(event.message);
			setError(newError);

			// Track error to Signoz
			trackError(newError, {
				error_type: "unhandled_error",
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
			});
		};

		const handlePromiseRejection = (event: PromiseRejectionEvent) => {
			const newError = new Error(
				event.reason?.message || "Unhandled promise rejection",
			);
			setError(newError);

			// Track error to Signoz
			trackError(newError, {
				error_type: "unhandled_promise_rejection",
				reason: String(event.reason),
			});
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
	}, []);

	if (error) {
		return (
			<ErrorFallback error={error} resetError={() => setError(null)} />
		);
	}

	return <>{children}</>;
}
