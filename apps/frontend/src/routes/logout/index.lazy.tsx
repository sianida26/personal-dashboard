import useAuth from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/logout/")({
	component: LogoutPage,
});

export default function LogoutPage() {
	const { isAuthenticated, clearAuthData } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (isAuthenticated) {
			clearAuthData();

			queryClient.invalidateQueries({
				queryKey: ["my-profile"],
			});
		}

		navigate({
			to: "/login",
			replace: true,
		});
	}, [navigate, isAuthenticated, clearAuthData, queryClient]);

	return <div>Logging out...</div>;
}
