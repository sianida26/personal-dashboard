/**
 * Hook to check if observability is enabled.
 * For now, we'll default to true since the backend has observability endpoints.
 * This can be enhanced later to check app settings or environment variables.
 */
export function useObservabilityToggle() {
	// For Phase 2.1, we'll default to enabled since the backend infrastructure exists
	// This can be enhanced later to check actual app settings
	const isEnabled = true;

	return isEnabled;
}
