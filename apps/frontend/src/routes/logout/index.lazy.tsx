import useAuth from "@/hooks/useAuth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/logout/")({
	component: LogoutPage,
});

export default function LogoutPage() {
	const { isAuthenticated, clearAuthData } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			clearAuthData();
		}

		navigate({
			to: "/login",
			replace: true,
		});
	}, [navigate, isAuthenticated, clearAuthData]);

	return <div>Logging out...</div>;
}
