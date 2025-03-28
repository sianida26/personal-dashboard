import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login/")({
	loader: async () => {
		const loginSettings = await fetchRPC(
			client.auth["login-settings"].$get(),
		);
		return loginSettings;
	},
});
