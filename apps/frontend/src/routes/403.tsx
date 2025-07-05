import type { ExtendedPermissionCodeWithAll } from "@repo/data";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import illustration from "@/assets/illustrations/undraw_alert_w756.svg";
import usePermissionChecker from "@/hooks/usePermissionChecker";

export const Route = createFileRoute("/403")({
	component: RouteComponent,
});

function RouteComponent() {
	const [originalPermissions, setOriginalPermissions] = useState<
		ExtendedPermissionCodeWithAll[]
	>([]);

	// Get the original route and permissions from sessionStorage
	useEffect(() => {
		const storedPermissions = sessionStorage.getItem("originalPermissions");

		if (storedPermissions) {
			try {
				setOriginalPermissions(JSON.parse(storedPermissions));
			} catch (error) {
				console.error("Error parsing stored permissions:", error);
			}
		}
	}, []);

	// Use the permission checker hook to auto-check permissions
	usePermissionChecker(
		originalPermissions.length > 0
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

	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center gap-8 px-4 lg:px-8">
			<img
				src={illustration}
				alt="403 Forbidden Illustration"
				className="w-full max-w-(--breakpoint-md)"
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
