import { userQueryOptions } from "@/modules/usersManagement/queries/userQueries";
import PageTemplate from "@/components/PageTemplate";
import { createLazyFileRoute } from "@tanstack/react-router";
// import UserFormModal from "@/modules/usersManagement/modals/UserFormModal";
import ExtractQueryDataType from "@/types/ExtractQueryDataType";
import { createColumnHelper } from "@tanstack/react-table";
import createActionButtons from "@/utils/createActionButton";
import { TbEye, TbPencil, TbTrash } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import UserDeleteModal from "@/modules/usersManagement/modals/UserDeleteModal";

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
			modals={[]}
			columnDefs={[
				columnHelper.display({
					header: "#",
					cell: (props) => props.row.index + 1,
				}),

				columnHelper.display({
					id: "Name",
					header: ({ column }) => {
						return (
							<Button
								variant="ghost"
								onClick={() =>
									column.toggleSorting(
										column.getIsSorted() === "asc"
									)
								}
							>
								Name
							</Button>
						);
					},
					cell: (props) => props.row.original.name,
				}),

				columnHelper.display({
					header: "Username",
					cell: (props) => props.row.original.username,
				}),

				columnHelper.display({
					header: "Status",
					cell: (props) =>
						props.row.original.isEnabled ? (
							<Badge className="bg-green-500">Active</Badge>
						) : (
							<Badge className="bg-gray-500">Inactive</Badge>
						),
				}),

				columnHelper.display({
					header: "Actions",
					cell: (props) => (
						<div className="flex gap-2">
							{createActionButtons([
								{
									label: "Detail",
									permission: true,
									action: `?detail=${props.row.original.id}`,
									className:
										"bg-green-500 hover:bg-green-600",
									icon: <TbEye />,
								},
								{
									label: "Edit",
									permission: true,
									action: `?edit=${props.row.original.id}`,
									className:
										"bg-yellow-500 hover:bg-yellow-600",
									icon: <TbPencil />,
								},
								{
									label: "Delete",
									permission: true,
									action: `?delete=${props.row.original.id}`,
									variant: "outline",
									className:
										"border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
									icon: <TbTrash />,
								},
							])}
						</div>
					),
				}),
			]}
		/>
	);
}
