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
 * Handles the Microsoft OAuth callback for admin authentication
 * @param sessionId The session ID returned from the Microsoft OAuth admin callback
 * @returns The authentication data including the access token and admin user info
 */
export async function handleMicrosoftAdminCallback(sessionId: string) {
	try {
		// Request the auth data from the backend
		const response = await fetch(
			`${import.meta.env.VITE_BACKEND_BASE_URL}/auth/microsoft/admin-auth-data/${sessionId}`,
		);

		if (!response.ok) {
			throw new Error("Failed to get admin authentication data");
		}

		const authData = await response.json();
		return authData;
	} catch (error) {
		console.error("Error handling Microsoft admin callback:", error);
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

/**
 * Initiates the Microsoft OAuth admin login flow
 */
export function loginWithMicrosoftAsAdmin() {
	// Redirect to Microsoft admin login endpoint
	window.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}/auth/microsoft/admin-login`;
}
