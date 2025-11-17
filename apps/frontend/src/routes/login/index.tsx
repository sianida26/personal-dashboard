import { createFileRoute } from "@tanstack/react-router";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/login/")({
	loader: async () => {
		const loginSettings = await fetchRPC(
			client.auth["login-settings"].$get(),
		);
		return loginSettings;
	},
});
