import isAuthenticated from "@/utils/isAuthenticated";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/logout/")({
	component: LogoutPage,
});

export default function LogoutPage() {
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated()) {
			localStorage.removeItem("accessToken");
		}

		navigate({
			to: "/login",
			replace: true,
		});
	}, [navigate]);

	return <div>Logging out...</div>;
}
