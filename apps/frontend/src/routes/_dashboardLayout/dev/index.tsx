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
						type: "text",
						label: "Hehe",
					},
					{
						type: "select",
						label: "Input",
						data: [
							{
								value: "1",
								label: "Option 1",
							},
							{
								value: "2",
								label: "Option 2",
							},
						],
					},
				],
			})}
		</div>
	);
}
