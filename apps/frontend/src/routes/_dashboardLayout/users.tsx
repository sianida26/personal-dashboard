import { userQueryOptions } from '@/modules/usersManagement/queries/userQueries'
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/users")({
	loader: ({ context: { queryClient } }) => {
		queryClient.ensureQueryData(userQueryOptions(0, 10));
	},

	staticData: {
		title: "Users",
	},
});
