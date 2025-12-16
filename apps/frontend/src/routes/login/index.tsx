import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

const DEFAULT_LOGIN_SETTINGS = {
	enableGoogleOAuth: false,
	enableMicrosoftOAuth: false,
	enableUsernameAndPasswordLogin: true,
};

const loginSearchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/login/")({
	validateSearch: loginSearchSchema,
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
