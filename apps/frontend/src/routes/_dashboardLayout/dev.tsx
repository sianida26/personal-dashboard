import { usePermissions } from "@/hooks/useAuth";
import { DatePicker } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/dev")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	usePermissions("dev-routes");

	return <DatePicker allowDeselect={true} mode="range" />;
}
