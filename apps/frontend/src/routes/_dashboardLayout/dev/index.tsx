import { NumberInput } from "@/components/ui/number-input";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/dev/")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	return (
		<div className="p-4 w-56">
			<NumberInput label="berapa?" />
		</div>
	);
}
