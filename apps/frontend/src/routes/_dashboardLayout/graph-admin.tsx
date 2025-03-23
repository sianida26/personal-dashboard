import { createFileRoute } from "@tanstack/react-router";
import { usePermissions } from "../../hooks/useAuth";
import AdminOperations from "@/pages/AdminOperations";

export const Route = createFileRoute("/_dashboardLayout/graph-admin")({
	component: AdminWrapper,
	staticData: {
		title: "Admin Operations",
	},
});

function AdminWrapper() {
	// Check if user has both required permissions
	usePermissions(["ms-graph.read"]);

	// Redirect to the admin page which is defined outside the dashboard layout
	return <AdminOperations />;
}
