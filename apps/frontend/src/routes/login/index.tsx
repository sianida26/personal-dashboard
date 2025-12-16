import { createFileRoute } from "@tanstack/react-router";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

const DEFAULT_LOGIN_SETTINGS = {
	enableGoogleOAuth: false,
	enableMicrosoftOAuth: false,
	enableUsernameAndPasswordLogin: true,
};

export const Route = createFileRoute("/login/")({
	loader: async () => {
		try {
			const loginSettings = await fetchRPC(
				client.auth["login-settings"].$get(),
			);

			return {
				...DEFAULT_LOGIN_SETTINGS,
				...loginSettings,
				isFallback: false,
			};
		} catch (error) {
			console.error("[login] failed to load login settings", error);

			return {
				...DEFAULT_LOGIN_SETTINGS,
				isFallback: true,
			};
		}
	},
});
