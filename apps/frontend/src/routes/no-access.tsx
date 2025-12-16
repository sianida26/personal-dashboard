import type { ExtendedPermissionCodeWithAll } from "@repo/data";
import { Alert, AlertDescription, AlertTitle, Button } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import illustration from "@/assets/illustrations/undraw_alert_w756.svg";
import useAuth from "@/hooks/useAuth";
import usePermissionChecker from "@/hooks/usePermissionChecker";

export const Route = createFileRoute("/no-access")({
	component: RouteComponent,
});

function RouteComponent() {
	const { clearAuthData, user, hasNoAccess } = useAuth();
	const [originalPermissions, setOriginalPermissions] = useState<
		ExtendedPermissionCodeWithAll[]
	>([]);

	// Check if this is a 403 case (missing specific permissions) or no-access case (no roles/permissions at all)
	const isNoAccessCase = hasNoAccess();

	// Get the original route and permissions from sessionStorage (for 403 case)
	useEffect(() => {
		if (!isNoAccessCase) {
			const storedPermissions = sessionStorage.getItem(
				"originalPermissions",
			);

			if (storedPermissions) {
				try {
					setOriginalPermissions(JSON.parse(storedPermissions));
				} catch (error) {
					console.error("Error parsing stored permissions:", error);
				}
			}
		}
	}, [isNoAccessCase]);

	// Use the permission checker hook to auto-check permissions (for 403 case)
	usePermissionChecker(
		!isNoAccessCase && originalPermissions.length > 0
			? originalPermissions
			: ["authenticated-only"],
		{
			autoCheckInterval: 10000, // Check every 10 seconds
			redirectOnRestore: true,
			onPermissionRestored: () => {
				// Clean up stored data
				sessionStorage.removeItem("originalRoute");
				sessionStorage.removeItem("originalPermissions");
			},
		},
	);

	const handleLogout = async () => {
		await clearAuthData();
		window.location.href = "/login";
	};

	// Render different content based on the case
	if (isNoAccessCase) {
		// User has no roles and no permissions
		return (
			<div className="w-screen h-screen flex flex-col items-center justify-center gap-8 px-4 lg:px-8">
				<img
					src={illustration}
					alt="No Access Illustration"
					className="w-full max-w-sm"
				/>
				<div className="flex flex-col items-center gap-6 text-center max-w-lg">
					<div className="flex flex-col gap-4">
						<h1 className="text-4xl font-bold">
							Account Access Pending
						</h1>
						<p className="text-muted-foreground text-base">
							Your account has been created successfully, but you
							don't have any roles or permissions assigned yet.
						</p>
					</div>

					<Alert variant="default" className="text-left">
						<Mail className="h-4 w-4" />
						<AlertTitle>What's Next?</AlertTitle>
						<AlertDescription className="space-y-2">
							<p>
								An administrator needs to assign you the
								appropriate roles and permissions to access the
								system.
							</p>
							<p className="font-medium">
								Please contact your system administrator to
								request access.
							</p>
							{user?.name && (
								<p className="text-sm text-muted-foreground mt-2">
									Your account:{" "}
									<span className="font-mono">
										{user.name}
									</span>
								</p>
							)}
						</AlertDescription>
					</Alert>

					<Button
						onClick={handleLogout}
						variant="destructive"
						className="mt-4"
					>
						Logout
					</Button>
				</div>
			</div>
		);
	}

	// User tried to access a page without the required permissions (403)
	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center gap-8 px-4 lg:px-8">
			<img
				src={illustration}
				alt="403 Forbidden Illustration"
				className="w-full max-w-sm"
			/>
			<div className="flex flex-col items-center text-lg gap-4 text-center">
				<h1 className="text-4xl font-bold">403 - Access Denied</h1>
				<p className="text-muted-foreground text-base">
					You don't have the necessary permissions to access this
					page.
				</p>
				<p className="text-muted-foreground text-base">
					If you believe this is an error, please contact your
					administrator or try again later.
				</p>

				<a href="/" className="font-medium">
					Take me home! 🏠
				</a>
			</div>
		</div>
	);
}
