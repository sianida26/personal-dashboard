import { createFileRoute, Navigate } from "@tanstack/react-router";
import { usePermissions } from "../../hooks/useAuth";
import AdminOperations from "@/pages/AdminOperations";

export const Route = createFileRoute("/_dashboardLayout/admin")({
	component: AdminWrapper,
	staticData: {
		title: "Admin Operations",
	},
});

function AdminWrapper() {
	// Check if user has the required permission
	usePermissions("graph-admin");

	// Redirect to the admin page which is defined outside the dashboard layout
	return <AdminOperations />;
}
