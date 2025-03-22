/**
 * Handles the Microsoft OAuth callback
 * @param sessionId The session ID returned from the Microsoft OAuth callback
 * @returns The authentication data including the access token and user info
 */
export async function handleMicrosoftCallback(sessionId: string) {
	try {
		// Request the auth data from the backend
		const response = await fetch(
			`${import.meta.env.VITE_BACKEND_BASE_URL}/auth/microsoft/auth-data/${sessionId}`,
		);

		if (!response.ok) {
			throw new Error("Failed to get authentication data");
		}

		const authData = await response.json();
		return authData;
	} catch (error) {
		console.error("Error handling Microsoft callback:", error);
		throw error;
	}
}

/**
 * Initiates the Microsoft OAuth login flow
 */
export function loginWithMicrosoft() {
	// Redirect to Microsoft login endpoint
	window.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}/auth/microsoft/login`;
}
