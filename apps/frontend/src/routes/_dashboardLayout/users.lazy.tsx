import { Badge, Button } from "@repo/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TbEye, TbPencil, TbTrash } from "react-icons/tb";
import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";

export const Route = createFileRoute()({
	component: UsersPage,
});

export default function UsersPage() {
	const navigate = useNavigate();

	return createPageTemplate({
		title: "Users",
		endpoint: client.users.$get,
		queryKey: ["users"],
		createButton: "Create User",
		sortableColumns: ["name", "username"],
		filterableColumns: [
			{
				id: "isEnabled",
				type: "select",
				options: [
					{ label: "Active", value: "Active" },
					{ label: "Inactive", value: "Inactive" },
				],
				label: "Status",
			},
			{
				id: "roles",
				type: "select",
				options: [
					{ label: "Administrator", value: "admin" },
					{ label: "Moderator", value: "moderator" },
					{ label: "User", value: "user" },
				],
				label: "User Role",
			},
		],
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
			helper.accessor("username", {
				cell: (info) => info.getValue(),
				header: "Username",
			}),
			helper.accessor("isEnabled", {
				cell: (info) =>
					info.getValue() ? (
						<Badge className="text-green-500 bg-green-100">
							Active
						</Badge>
					) : (
						<Badge className="text-gray-500 bg-gray-100">
							Inactive
						</Badge>
					),
				header: "Status",
			}),
			helper.accessor("roles", {
				cell: (info) =>
					info.row.original.roles &&
					info.row.original.roles.length > 0 ? (
						info.row.original.roles.slice(0, 3).map((role) => (
							<span
								key={role.id}
								className="chip"
								style={{
									display: "inline-block",
									padding: "2px 6px",
									marginRight: "4px",
									backgroundColor: "#e0e0e0",
									borderRadius: "12px",
									fontSize: "0.8rem",
								}}
							>
								{role.name}
							</span>
						))
					) : (
						<span>No roles</span>
					),
				header: "Roles",
			}),
			helper.accessor("createdAt", {
				cell: (info) => {
					const date = info.getValue();
					return date
						? new Date(date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric",
							})
						: "-";
				},
				header: "Created At",
			}),
			helper.display({
				header: "Actions",
				cell: (props) => (
					<div className="flex gap-2">
						{createActionButtons([
							{
								label: "Detail",
								permission: true,
								action: `./detail/${props.row.original.id}`,
								className: "bg-green-500 hover:bg-green-600",
								icon: <TbEye />,
							},
							{
								label: "Edit",
								permission: true,
								action: `./edit/${props.row.original.id}`,
								className: "bg-yellow-500 hover:bg-yellow-600",
								icon: <TbPencil />,
							},
							{
								label: "Delete",
								permission: true,
								action: () =>
									navigate({
										to: "/users/delete/$userId",
										params: {
											userId: props.row.original.id,
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
