import { Button } from "@repo/ui";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import { loginWithMicrosoftAsAdmin } from "../utils/microsoftAuth";
import { Separator } from "@repo/ui";

// Define interface for Microsoft Graph user objects
interface MicrosoftGraphUser {
	id: string;
	displayName: string;
	mail?: string;
	userPrincipalName: string;
}

/**
 * Admin Operations Page Component
 *
 * This page allows authenticated users to:
 * 1. Authenticate as an admin user via Microsoft
 * 2. Perform admin-specific operations using the Microsoft Graph API
 */
export default function AdminOperations() {
	const auth = useAuth();
	const [adminActionResult, setAdminActionResult] = useState<string | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	// Check if user is authenticated as admin
	const isAdminAuthenticated = auth.user?.isAdmin === true;

	// Sample admin operation - list users
	const {
		data: users,
		isLoading,
		refetch,
	} = useQuery<MicrosoftGraphUser[]>({
		queryKey: ["admin-users"],
		queryFn: async () => {
			try {
				setError(null);
				// This would call your backend endpoint that uses the admin Graph client
				const response = await fetch(
					`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/users`,
					{
						headers: {
							Authorization: `Bearer ${auth.accessToken}`,
						},
					},
				);

				if (!response.ok) {
					throw new Error("Failed to fetch users as admin");
				}

				return await response.json();
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to perform admin operation",
				);
				return [];
			}
		},
		enabled: false, // Don't run automatically
	});

	// Handle admin authentication
	const handleAdminAuth = () => {
		loginWithMicrosoftAsAdmin();
	};

	// Example admin action
	const performAdminAction = async () => {
		try {
			setError(null);
			setAdminActionResult("Performing admin operation...");

			// This would call your backend endpoint that uses the admin Graph client
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/action`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${auth.accessToken}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to perform admin operation");
			}

			const result = await response.json();
			setAdminActionResult(
				`Operation completed successfully: ${result.message}`,
			);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to perform admin operation",
			);
			setAdminActionResult(null);
		}
	};

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-3xl font-bold mb-6">
				Microsoft Graph Admin Operations
			</h1>

			{!isAdminAuthenticated ? (
				<Card>
					<CardHeader>
						<CardTitle>Admin Authentication Required</CardTitle>
						<CardDescription>
							You need to authenticate as an admin to access these
							operations
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={handleAdminAuth}>
							Authenticate as Admin
						</Button>
					</CardContent>
				</Card>
			) : (
				<>
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Admin Operations</CardTitle>
							<CardDescription>
								You are authenticated as an admin user (
								{auth.user?.name})
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Button onClick={() => refetch()}>
									List Users (Admin Operation)
								</Button>
							</div>

							<Separator />

							<div>
								<Button onClick={performAdminAction}>
									Perform Other Admin Action
								</Button>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{adminActionResult && (
								<Alert>
									<AlertTitle>Result</AlertTitle>
									<AlertDescription>
										{adminActionResult}
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>

					{isLoading ? (
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" />
					) : users && users.length > 0 ? (
						<Card>
							<CardHeader>
								<CardTitle>Users (Admin View)</CardTitle>
								<CardDescription>
									Users retrieved using admin permissions
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="divide-y">
									{users?.map((user: MicrosoftGraphUser) => (
										<li key={user.id} className="py-2">
											<div className="font-medium">
												{user.displayName}
											</div>
											<div className="text-sm text-gray-500">
												{user.mail ||
													user.userPrincipalName}
											</div>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					) : null}
				</>
			)}
		</div>
	);
} 