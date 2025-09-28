import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/dashboard/")({
	component: DashboardPage,
	staticData: {
		title: "Dashboard",
	},
});

export default function DashboardPage() {
	return <div>Hello Dashboard!</div>;
}
