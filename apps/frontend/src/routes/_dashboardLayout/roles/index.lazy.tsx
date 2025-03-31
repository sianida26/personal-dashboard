import { createPageTemplate } from "@/components/PageTemplate";
import { Button } from "@repo/ui";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { TbPencil, TbTrash } from "react-icons/tb";

export const Route = createLazyFileRoute("/_dashboardLayout/roles/")({
	component: RolesPage,
});

export default function RolesPage() {
	const navigate = useNavigate();

	return createPageTemplate({
		title: "Roles",
		endpoint: client.roles.$get,
		queryKey: ["roles"],
		createButton: "Create Role",
		sortableColumns: ["name"],
		columnBorders: true,
		columnDefs: (helper) => [
			helper.display({
				header: "#",
				cell: (props) =>
					props.table.getState().pagination.pageIndex *
						props.table.getState().pagination.pageSize +
					props.row.index +
					1,
				size: 1,
			}),
			helper.accessor("name", {
				cell: (info) => info.getValue(),
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
						>
							Name
						</Button>
					);
				},
			}),
			helper.accessor("description", {
				cell: (info) => info.getValue(),
				header: "Description",
			}),
			helper.accessor("permissions", {
				cell: (info) => info.getValue().length,
				header: "Permissions",
			}),
			helper.display({
				header: "Actions",
				cell: (props) => (
					<div className="flex gap-2">
						{createActionButtons([
							{
								label: "Edit",
								permission: true,
								action: () =>
									navigate({
										to: "/roles/edit/$roleId",
										params: {
											roleId: props.row.original.id,
										},
									}),
								className: "bg-yellow-500 hover:bg-yellow-600",
								icon: <TbPencil />,
							},
							{
								label: "Delete",
								permission: true,
								action: () =>
									navigate({
										to: "/roles/delete/$id",
										params: {
											id: props.row.original.id,
										},
									}),
								variant: "outline",
								className:
									"border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
								icon: <TbTrash />,
							},
						])}
					</div>
				),
			}),
		],
	});
}
