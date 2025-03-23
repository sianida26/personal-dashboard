import { createFileRoute } from "@tanstack/react-router";
import AdminOperations from "../pages/AdminOperations";

export const Route = createFileRoute("/admin")({
	component: AdminOperations,
	staticData: {
		title: "Admin Operations",
	},
}); 