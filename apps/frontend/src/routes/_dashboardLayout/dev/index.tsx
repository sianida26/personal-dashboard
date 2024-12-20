import Timetable from "@/components/Timetable";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/dev/")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	return (
		<div className="p-4">
			<Timetable events={[]} />
		</div>
	);
}
