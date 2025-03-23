import { useEffect, useState } from "react";
import { handleMicrosoftAdminCallback } from "../../utils/microsoftAuth";
import { useNavigate } from "@tanstack/react-router";
import { authDB } from "../../indexedDB/authDB";
import useAuth from "../../hooks/useAuth";

/**
 * Microsoft OAuth Admin Callback component
 * This component handles the callback from Microsoft OAuth admin authentication
 * It extracts the session ID from the URL, fetches the admin auth data,
 * and stores it in the auth context and IndexedDB
 */
export default function MicrosoftAdminCallback() {
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const { saveAuthData } = useAuth();

	useEffect(() => {
		// Function to handle the admin callback
		const processAdminCallback = async () => {
			try {
				// Get the session ID from URL params
				const params = new URLSearchParams(window.location.search);
				const sessionId = params.get("session");

				if (!sessionId) {
					setError("No session ID found in the URL");
					return;
				}

				// Fetch admin auth data using the session ID
				const authData = await handleMicrosoftAdminCallback(sessionId);

				if (!authData || !authData.accessToken) {
					setError("Invalid authentication data received");
					return;
				}

				// Store admin auth data in IndexedDB with admin flag
				await authDB.auth.put({
					key: "admin_auth",
					userId: authData.user.id,
					userName: authData.user.name,
					permissions: authData.user.permissions,
					roles: authData.user.roles,
					accessToken: authData.accessToken,
					isAdmin: true,
				});

				// Update auth context
				saveAuthData(
					{ ...authData.user, isAdmin: true },
					authData.accessToken,
				);

				// Redirect to admin dashboard
				navigate({ to: "/graph-admin" });
			} catch (err) {
				console.error("Error in Microsoft admin callback:", err);
				setError(
					"Failed to complete admin authentication. Please try again.",
				);
			}
		};

		processAdminCallback();
	}, [navigate, saveAuthData]);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<div
					className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-md w-full"
					role="alert"
				>
					<strong className="font-bold">
						Admin Authentication Error
					</strong>
					<span className="block sm:inline"> {error}</span>
				</div>
				<button
					type="button"
					onClick={() => navigate({ to: "/" })}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
				>
					Return to Dashboard
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-4">
					Completing Admin Sign In
				</h1>
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
				<p className="mt-4 text-gray-600">
					Please wait while we complete your admin sign in...
				</p>
			</div>
		</div>
	);
}
