import { Badge, Button } from "@repo/ui";
import { useNavigate, createLazyFileRoute } from "@tanstack/react-router";
import { TbCopy, TbEye, TbPencil, TbUsers } from "react-icons/tb";
import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";

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
		sortableColumns: ["name", "code"],
		searchBar: true,
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
				cell: (info) => (
					<div className="flex flex-col">
						<span className="font-medium">{info.getValue()}</span>
						{info.row.original.code && (
							<span className="text-xs text-muted-foreground">
								{info.row.original.code}
							</span>
						)}
					</div>
				),
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
					)
				},
			}),
			helper.accessor("description", {
				cell: (info) => (
					<div className="max-w-xs">
						<span className="text-sm text-muted-foreground line-clamp-2">
							{info.getValue() || "No description"}
						</span>
					</div>
				),
				header: "Description",
			}),
			helper.accessor("permissions", {
				cell: (info) => (
					<div className="flex items-center gap-2">
						<TbUsers className="h-4 w-4 text-muted-foreground" />
						<Badge variant="secondary" className="text-xs">
							{info.getValue().length} permissions
						</Badge>
					</div>
				),
				header: "Permissions",
			}),
			helper.display({
				header: "Actions",
				cell: (props) => (
					<div className="flex gap-2">
						{createActionButtons([
							{
								label: "View",
								permission: true,
								action: () =>
									navigate({
										to: "/roles/view/$roleId",
										params: {
											roleId: props.row.original.id,
										},
									}),
								className: "bg-blue-500 hover:bg-blue-600",
								icon: <TbEye />,
							},
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
								label: "Duplicate",
								permission: true,
								action: () =>
									navigate({
										to: "/roles/create",
										search: {
											template: props.row.original.id,
										},
									}),
								variant: "outline",
								className:
									"border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white",
								icon: <TbCopy />,
							},
						])}
					</div>
				),
			}),
		],
	})
}
