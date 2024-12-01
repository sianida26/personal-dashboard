import { userQueryOptions } from "@/modules/usersManagement/queries/userQueries";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchParamSchema = z.object({
	create: z.boolean().default(false).optional(),
	edit: z.string().default("").optional(),
	delete: z.string().default("").optional(),
	detail: z.string().default("").optional(),
});

export const Route = createFileRoute("/_dashboardLayout/users/")({
	validateSearch: searchParamSchema,

	loader: ({ context: { queryClient } }) => {
		queryClient.ensureQueryData(userQueryOptions(0, 10));
	},

	staticData: {
		title: "Users",
	},
});
