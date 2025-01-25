import PageTemplate from "@/components/PageTemplate";
import { Button } from "@/components/ui/button";
import client from "@/honoClient";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/roles")({
	component: RouteComponent,
});

function RouteComponent() {
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
										column.getIsSorted() === "asc"
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
				// helper.accessor("permissions", {
				// 	cell: (info) => info.getValue(),
				// 	header: "Permissions",
				// }),
			]}
		/>
	);
}
