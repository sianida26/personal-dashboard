import { Pagination } from "@/components/ui/pagination";
import { usePermissions } from "@/hooks/useAuth";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_dashboardLayout/dev")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	usePermissions("dev-routes");

	const [currentPage, setCurrentPage] = useState(1);

	return (
		<Pagination total={6} value={currentPage} onChange={setCurrentPage} />
	);
}
