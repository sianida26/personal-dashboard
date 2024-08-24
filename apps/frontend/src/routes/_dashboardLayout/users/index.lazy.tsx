import { Card, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import UsersTable from "../../../modules/usersManagement/tables/UsersTable";
import { z } from "zod";
import { userQueryOptions } from "@/modules/usersManagement/queries/userQueries";

const searchParamSchema = z.object({
	create: z.boolean().default(false).optional(),
	edit: z.string().default("").optional(),
	delete: z.string().default("").optional(),
	detail: z.string().default("").optional(),
});

export const Route = createFileRoute("/_dashboardLayout/users/")({
	component: UsersPage,

	validateSearch: searchParamSchema,

	loader: ({ context: { queryClient } }) => {
		queryClient.ensureQueryData(userQueryOptions);
	},
});

export default function UsersPage() {
	return (
		<Stack>
			<Title order={1}>Users</Title>
			<Card>
				<UsersTable />
			</Card>
		</Stack>
	);
}
