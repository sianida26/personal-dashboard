import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";

export const Route = createFileRoute()({
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

		navigate({ to: "/login", replace: true });
	});

	return <div>Logging out...</div>;
}
