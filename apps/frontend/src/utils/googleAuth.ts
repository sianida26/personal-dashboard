/**
 * Handles the Google OAuth callback
 * @param sessionId The session ID returned from the Google OAuth callback
 * @returns The authentication data including the access token and user info
 */
export async function handleGoogleCallback(sessionId: string) {
	try {
		// Request the auth data from the backend
		const response = await fetch(
			`${import.meta.env.VITE_BACKEND_BASE_URL}/auth/google/auth-data/${sessionId}`,
		);

		if (!response.ok) {
			throw new Error("Failed to get authentication data");
		}

		const authData = await response.json();
		return authData;
	} catch (error) {
		console.error("Error handling Google callback:", error);
		throw error;
	}
}

/**
 * Initiates the Google OAuth login flow
 */
export function loginWithGoogle() {
	// Redirect to Google login endpoint
	window.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}/auth/google`;
}
