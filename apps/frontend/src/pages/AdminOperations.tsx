import { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui";
import { UserCircle, RefreshCcw, CheckCircle } from "lucide-react";
import ResponseError from "@/errors/ResponseError";
import fetchRPC from "@/utils/fetchRPC";
import client from "@/honoClient";

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

// Simplified admin operations component that only handles authentication
export default function AdminOperations() {
	const [authenticating, setAuthenticating] = useState(false);
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
			const response = await fetchRPC<AdminAuthStatus>(
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

			// First, get a CSRF token from the backend
			const csrfResponse = await fetchRPC<{ csrfToken: string }>(
				client.auth.microsoft.admin["csrf-token"].$get(),
			);

			// Then, redirect to the login endpoint with the CSRF token
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
								<p className="text-sm text-green-600 mt-2">
									The backend can now perform Microsoft Graph
									admin operations.
								</p>
							</div>
						</div>
					) : (
						<>
							{authMessage && (
								<Alert
									className={`mb-4 ${authMessage.type === "error" ? "bg-red-50" : "bg-green-50"}`}
								>
									<AlertTitle>
										{authMessage.type === "success"
											? "Success"
											: "Error"}
									</AlertTitle>
									<AlertDescription>
										{authMessage.message}
									</AlertDescription>
								</Alert>
							)}
							<p className="mb-4 text-gray-600">
								Microsoft Graph authentication is required for
								admin operations. Click the button below to
								authenticate.
							</p>
							<Button
								onClick={authenticateWithMicrosoft}
								disabled={authenticating}
								className="gap-2"
								type="button"
							>
								{authenticating ? (
									<>
										<RefreshCcw className="h-4 w-4 animate-spin" />
										Authenticating...
									</>
								) : (
									<>
										<UserCircle className="h-4 w-4" />
										Authenticate with Microsoft
									</>
								)}
							</Button>
						</>
					)}
				</CardContent>
				{authStatus?.authenticated && (
					<CardFooter className="flex justify-end border-t pt-4">
						<Button
							onClick={checkAuthStatus}
							variant="outline"
							type="button"
							className="gap-2"
						>
							<RefreshCcw className="h-4 w-4" />
							Refresh Status
						</Button>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
