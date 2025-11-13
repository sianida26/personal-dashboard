import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, createLazyFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { backendUrl } from "@/honoClient";

export const Route = createLazyFileRoute("/logout/")({
	component: LogoutPage,
});

export default function LogoutPage() {
	const { isAuthenticated, clearAuthData, accessToken, refreshToken } =
		useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	useEffect(() => {
		const performLogout = async () => {
			if (isAuthenticated && refreshToken) {
				try {
					await fetch(`${backendUrl}/auth/logout`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(accessToken
								? { Authorization: `Bearer ${accessToken}` }
								: {}),
						},
						body: JSON.stringify({ refreshToken }),
					});
				} catch (error) {
					console.error("Failed to revoke refresh token", error);
				}
			}

			await clearAuthData();
			await queryClient.invalidateQueries({
				queryKey: ["my-profile"],
			});

			navigate({ to: "/login", replace: true });
		};

		void performLogout();
	}, [
		isAuthenticated,
		refreshToken,
		accessToken,
		clearAuthData,
		queryClient,
		navigate,
	]);

	return <div>Logging out...</div>;
}
