import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/transactions")({
	staticData: {
		title: "Transaksi",
	},
});
