import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, LogOut, RefreshCcw, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ResponseError from "@/errors/ResponseError";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";
import { usePermissions } from "../../hooks/useAuth";

interface AdminAuthStatus {
	authenticated: boolean;
	organization?: string;
	error?: string;
	expiresAt?: null;
	adminUser?: {
		id: string;
		name: string;
		email: string;
	};
}

export const Route = createFileRoute("/_dashboardLayout/graph-admin")({
	component: GraphAdmin,
	staticData: {
		title: "Microsoft Graph Admin",
	},
});

function GraphAdmin() {
	// Check if user has required permissions
	usePermissions(["ms-graph.read"]);

	const [authenticating, setAuthenticating] = useState(false);
	const [deauthenticating, setDeauthenticating] = useState(false);
	const [authMessage, setAuthMessage] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Check authentication status on load
	useEffect(() => {
		checkAuthStatus();
	}, []);

	// Function to check Microsoft Graph admin authentication status
	const checkAuthStatus = async () => {
		try {
			setIsLoading(true);
			// Use direct fetch for the status endpoint
			const response = await fetchRPC(
				client.auth.microsoft.admin.status.$get(),
			);
			setAuthStatus(response);
		} catch (error) {
			setAuthMessage({
				type: "error",
				message:
					error instanceof ResponseError
						? error.message
						: "Failed to check authentication status",
			});
			setAuthStatus({ authenticated: false });
		} finally {
			setIsLoading(false);
		}
	};

	// Function to authenticate with Microsoft Graph as admin
	const authenticateWithMicrosoft = async () => {
		try {
			setAuthenticating(true);
			setAuthMessage(null);

			// Get a CSRF token from the backend
			const csrfResponse = await fetchRPC<{ csrfToken: string }>(
				client.auth.microsoft.admin["csrf-token"].$get(),
			);

			// Redirect to the login endpoint with the CSRF token
			window.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}/auth/microsoft/admin/login?csrf_token=${csrfResponse.csrfToken}`;
		} catch (error) {
			setAuthMessage({
				type: "error",
				message:
					error instanceof ResponseError
						? error.message
						: "Authentication failed",
			});
			setAuthenticating(false);
		}
	};

	// Function to deauthenticate from Microsoft Graph
	const deauthenticateFromMicrosoft = async () => {
		try {
			setDeauthenticating(true);
			setAuthMessage(null);

			// Call the deauthenticate endpoint
			await fetchRPC(client.auth.microsoft.admin.deauthenticate.$post());

			setAuthMessage({
				type: "success",
				message: "Successfully deauthenticated from Microsoft Graph",
			});

			// Refresh authentication status
			setAuthStatus({ authenticated: false });
		} catch (error) {
			setAuthMessage({
				type: "error",
				message:
					error instanceof ResponseError
						? error.message
						: "Failed to deauthenticate",
			});
		} finally {
			setDeauthenticating(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">
				Microsoft Graph Admin Authentication
			</h1>

			<Card>
				<CardHeader>
					<CardTitle>Microsoft Graph Authentication</CardTitle>
					<CardDescription>
						Authenticate with Microsoft to enable admin operations
						in the backend. This will not affect your current login
						session.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center p-4">
							<RefreshCcw className="h-6 w-6 animate-spin text-gray-400" />
						</div>
					) : authStatus?.authenticated ? (
						<div className="bg-green-50 p-4 rounded-md flex items-start">
							<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
							<div>
								<p className="font-semibold text-green-800">
									Successfully authenticated with Microsoft
									Graph
								</p>
								<p className="text-green-700 mt-1">
									Connected to: {authStatus.organization}
								</p>
								{authStatus.adminUser && (
									<p className="text-green-700 mt-1">
										Authenticated by:{" "}
										<span className="font-medium">
											{authStatus.adminUser.name}
										</span>{" "}
										({authStatus.adminUser.email})
									</p>
								)}
							</div>
						</div>
					) : (
						<div className="flex items-center space-x-2">
							<UserCircle className="h-5 w-5 text-gray-400" />
							<span>Not authenticated with Microsoft Graph</span>
						</div>
					)}

					{authMessage && (
						<Alert
							className={`mt-4 ${
								authMessage.type === "error"
									? "bg-red-50 text-red-900"
									: "bg-green-50 text-green-900"
							}`}
						>
							<AlertTitle>
								{authMessage.type === "error"
									? "Error"
									: "Success"}
							</AlertTitle>
							<AlertDescription>
								{authMessage.message}
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
				<CardFooter className="flex justify-end space-x-2">
					{authStatus?.authenticated ? (
						<Button
							variant="destructive"
							onClick={deauthenticateFromMicrosoft}
							disabled={deauthenticating}
						>
							{deauthenticating ? (
								<>
									<RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
									Deauthenticating...
								</>
							) : (
								<>
									<LogOut className="h-4 w-4 mr-2" />
									Deauthenticate
								</>
							)}
						</Button>
					) : (
						<Button
							onClick={authenticateWithMicrosoft}
							disabled={authenticating}
						>
							{authenticating ? (
								<>
									<RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
									Authenticating...
								</>
							) : (
								<>
									<UserCircle className="h-4 w-4 mr-2" />
									Authenticate with Microsoft
								</>
							)}
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
