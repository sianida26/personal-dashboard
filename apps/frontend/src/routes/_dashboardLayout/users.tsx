import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/users")({
	staticData: {
		title: "Users",
	},
});
