import { createFileRoute } from "@tanstack/react-router";
import UserFormModal from "./-UserForm";

export const Route = createFileRoute("/_dashboardLayout/users/edit/$userId")({
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useParams();

	return <UserFormModal formType="edit" userId={params.userId} />;
}
