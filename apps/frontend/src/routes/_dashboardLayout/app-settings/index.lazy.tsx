import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";
import { createLazyFileRoute } from "@tanstack/react-router";
import { TbPencil } from "react-icons/tb";
import dayjs from "dayjs";

export const Route = createLazyFileRoute("/_dashboardLayout/app-settings/")({
	component: RouteComponent,
});

function RouteComponent() {
	return createPageTemplate({
		title: "App Settings",
		endpoint: client["app-settings"].$get,
		columnDefs: (helper) => [
			helper.accessor("key", {
				header: "Key",
			}),
			helper.accessor("value", {
				header: "Value",
			}),
			helper.accessor("createdAt", {
				header: "Created At",
				cell: (info) =>
					info.getValue()
						? dayjs(info.getValue()).format("DD MMM YYYY, HH:mm:ss")
						: "-",
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
								className: "bg-yellow-500 hover:bg-yellow-600",
								icon: <TbPencil />,
							},
						])}
					</div>
				),
			}),
		],
	});
}
