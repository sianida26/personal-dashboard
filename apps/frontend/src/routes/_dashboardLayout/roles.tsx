import PageTemplate from "@/components/PageTemplate";
import { Button } from "@repo/ui";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";
import { createFileRoute } from "@tanstack/react-router";
import { TbPencil, TbTrash } from "react-icons/tb";

export const Route = createFileRoute("/_dashboardLayout/roles")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<PageTemplate
			endpoint={client.roles.$get}
			title="Roles"
			queryKey={["roles"]}
			columnDefs={(helper) => [
				helper.display({
					header: "#",
					cell: (props) => props.row.index + 1,
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
									action: `./edit/${props.row.original.id}`,
									className:
										"bg-yellow-500 hover:bg-yellow-600",
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
			]}
		/>
	);
}
