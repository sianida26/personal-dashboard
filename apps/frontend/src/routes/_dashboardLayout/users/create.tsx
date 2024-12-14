import { createFileRoute } from "@tanstack/react-router";
import UserFormModal from "./-UserForm";

export const Route = createFileRoute("/_dashboardLayout/users/create")({
	component: RouteComponent,
});

function RouteComponent() {
	return <UserFormModal formType="create" />;
}
