import { createFileRoute } from "@tanstack/react-router";
import UserFormModal from "./-UserForm";

export const Route = createFileRoute("/_dashboardLayout/users/detail/$userId")({
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useParams();

	return <UserFormModal formType="detail" userId={params.userId} />;
}
