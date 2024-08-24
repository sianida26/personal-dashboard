import { userQueryOptions } from "@/modules/usersManagement/queries/userQueries";
import PageTemplate from "@/components/PageTemplate";
import { createLazyFileRoute } from "@tanstack/react-router";
import UserFormModal from "@/modules/usersManagement/modals/UserFormModal";
import ExtractQueryDataType from "@/types/ExtractQueryDataType";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge, Flex } from "@mantine/core";
import createActionButtons from "@/utils/createActionButton";
import { TbEye, TbPencil, TbTrash } from "react-icons/tb";
import UserDeleteModal from "@/modules/usersManagement/modals/UserDeleteModal";

export const Route = createLazyFileRoute("/_dashboardLayout/users/")({
	component: UsersPage,
});

type DataType = ExtractQueryDataType<typeof userQueryOptions>;

const columnHelper = createColumnHelper<DataType>();

export default function UsersPage() {
	return (
		<PageTemplate
			title="Userssdfjsdklfj"
			queryOptions={userQueryOptions}
			modals={[<UserFormModal />, <UserDeleteModal />]}
			columnDefs={[
				columnHelper.display({
					header: "#",
					cell: (props) => props.row.index + 1,
				}),

				columnHelper.display({
					header: "Name",
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
							<Badge color="green">Active</Badge>
						) : (
							<Badge color="red">Inactive</Badge>
						),
				}),

				columnHelper.display({
					header: "Actions",
					cell: (props) => (
						<Flex gap="xs">
							{createActionButtons([
								{
									label: "Detail",
									permission: true,
									action: `?detail=${props.row.original.id}`,
									color: "green",
									icon: <TbEye />,
								},
								{
									label: "Edit",
									permission: true,
									action: `?edit=${props.row.original.id}`,
									color: "orange",
									icon: <TbPencil />,
								},
								{
									label: "Delete",
									permission: true,
									action: `?delete=${props.row.original.id}`,
									color: "red",
									icon: <TbTrash />,
								},
							])}
						</Flex>
					),
				}),
			]}
		/>
	);
}
