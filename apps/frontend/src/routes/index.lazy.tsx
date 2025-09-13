import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute()({
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

	return <div>index.lazy</div>;
}
