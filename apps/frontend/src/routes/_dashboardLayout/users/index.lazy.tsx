import { userQueryOptions } from "@/modules/usersManagement/queries/userQueries";
import PageTemplate from "@/components/PageTemplate";
import { createLazyFileRoute } from "@tanstack/react-router";
import UserFormModal from "@/modules/usersManagement/modals/UserFormModal";
import { createColumnHelper } from "@tanstack/react-table";
import ExtractQueryDataType from "@/types/ExtractQueryDataType";

export const Route = createLazyFileRoute("/_dashboardLayout/users/")({
	component: UsersPage,
});

type DataType = ExtractQueryDataType<typeof userQueryOptions>;

const columnHelper = createColumnHelper<DataType>();

export default function UsersPage() {
	return (
		<PageTemplate
			title="Users"
			queryOptions={userQueryOptions}
			modals={[<UserFormModal />]}
			columnDefs={[
				columnHelper.display({
					id: "sequence",
					header: "#",
					cell: (props) => props.row.index + 1,
					size: 1,
				}),

				columnHelper.accessor("email", {
					header: "Email",
				}),

				columnHelper.accessor("email", {
					header: "Email",
				}),
			]}
		/>
	);
}
