import { useNavigate, createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { handleGoogleCallback } from "../../utils/googleAuth";

export const Route = createLazyFileRoute("/oauth/google-callback")({
	component: GoogleCallback,
});

/**
 * Google OAuth callback component
 * This component handles the callback from Google OAuth authentication
 * It extracts the session ID from the URL, fetches the auth data,
 * and stores it in the auth context and IndexedDB
 */
function GoogleCallback() {
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const { saveAuthData } = useAuth();

	useEffect(() => {
		// Function to handle the callback
		const processCallback = async () => {
			try {
				// Get the session ID from URL params
				const params = new URLSearchParams(window.location.search);
				const sessionId = params.get("session");

				if (!sessionId) {
					setError("No session ID found in the URL");
					return;
				}

				// Fetch auth data using the session ID
				const authData = await handleGoogleCallback(sessionId);

				if (!authData || !authData.accessToken) {
					setError("Invalid authentication data received");
					return;
				}

				await saveAuthData(authData.user, {
					accessToken: authData.accessToken,
					refreshToken: authData.refreshToken,
				});

				// Redirect to dashboard or home page
				navigate({ to: "/" });
			} catch (err) {
				console.error("Error in Google callback:", err);
				setError(
					"Failed to complete authentication. Please try again.",
				);
			}
		};

		processCallback();
	}, [navigate, saveAuthData]);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<div
					className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-md w-full"
					role="alert"
				>
					<strong className="font-bold">Authentication Error</strong>
					<span className="block sm:inline"> {error}</span>
				</div>
				<button
					type="button"
					onClick={() => navigate({ to: "/login" })}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
				>
					Return to Login
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-4">Completing Sign In</h1>
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
				<p className="mt-4 text-gray-600">
					Please wait while we complete your sign in...
				</p>
			</div>
		</div>
	);
}
