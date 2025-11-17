import { LoadingSpinner } from "@repo/ui";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createLazyFileRoute("/")({
	component: HomePage,
});

export default function HomePage() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate({
			to: "/dashboard",
			replace: true,
		});
	}, [navigate]);

	return (
		<div className="flex h-screen w-screen items-center justify-center rounded-lg border bg-card">
			<LoadingSpinner />
		</div>
	);
}
