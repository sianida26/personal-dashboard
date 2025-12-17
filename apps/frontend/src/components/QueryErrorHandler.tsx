import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Global Query Error Handler
 *
 * Monitors React Query's error state and shows toast notifications
 * instead of letting errors crash the UI or replace it with error states.
 *
 * This component should be mounted once at the app root level.
 */
export function QueryErrorHandler() {
	const { reset } = useQueryErrorResetBoundary();
	const shownErrors = useRef(new Set<string>());

	useEffect(() => {
		// Listen for unhandled errors in the query cache
		const handleError = (event: ErrorEvent) => {
			const error = event.error;
			if (!error) return;

			const errorKey = `${error.message}-${Date.now()}`;

			// Deduplicate errors within a 5-second window
			const now = Date.now();
			shownErrors.current = new Set(
				Array.from(shownErrors.current).filter(
					(key) =>
						now - Number.parseInt(key.split("-").pop() || "0") <
						5000,
				),
			);

			if (shownErrors.current.has(errorKey)) return;
			shownErrors.current.add(errorKey);

			const isNetworkError =
				error.message?.includes("NetworkError") ||
				error.message?.includes("Failed to fetch") ||
				error.message?.includes("Network request failed") ||
				error.message?.includes("fetch failed");

			if (isNetworkError) {
				toast.error("Connection issue", {
					description:
						"Unable to reach the server. Using cached data where available.",
					duration: 5000,
				});
			}
		};

		window.addEventListener("error", handleError);
		return () => window.removeEventListener("error", handleError);
	}, [reset]);

	return null;
}
