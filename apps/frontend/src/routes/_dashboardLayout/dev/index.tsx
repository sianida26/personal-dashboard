import createInputComponents from "@/utils/createInputComponents";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/dev/")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	return (
		<div className="p-4 w-72">
			{createInputComponents({
				inputs: [
					{
						type: "group",
						legend: "Group",
						inputs: [
							{
								label: "Number Input",
								type: "number",
							},
							{
								label: "Text Input",
								type: "text",
							},
							{
								label: "File Input",
								type: "file-input",
							},
						],
					},
				],
			})}
		</div>
	);
}
