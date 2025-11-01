/**
 * Hook to check if observability is enabled.
 * For now, we'll default to false until the backend observability endpoints are implemented.
 * This can be enhanced later to check app settings or environment variables.
 */
export function useObservabilityToggle() {
	// Disabled for now since backend /observability endpoints don't exist yet
	// This prevents constant 404 errors from frontend trying to report to non-existent endpoints
	const isEnabled = false;

	return isEnabled;
}
