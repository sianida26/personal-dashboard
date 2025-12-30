import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	type AdaptiveColumnDef,
	ServerDataTable,
} from "@/components/AdaptiveTable";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";
import type { ChemicalElement } from "@/utils/tempChemicalElements";

export const Route = createFileRoute("/_dashboardLayout/dev")({
	component: RouteComponent,
});

const SAVE_STATE_KEY = "chemical-elements-table";

function RouteComponent() {
	usePermissions("dev-routes");

	const handleEdit = (rowIndex: number, columnId: string, value: unknown) => {
		alert(`Edit row ${rowIndex}, column ${columnId} to ${value}`);
	};

	const columns = useMemo<AdaptiveColumnDef<ChemicalElement>[]>(
		() => [
			{
				accessorKey: "atomicNumber",
				header: "Atomic #",
				// Auto-detects as "number" filter based on accessor key pattern and sample data
			},
			{
				accessorKey: "symbol",
				header: "Symbol",
			},
			{
				accessorKey: "name",
				header: "Name",
				// editable: true,
				editType: "text",
				enableHiding:true
			},
			{
				accessorKey: "atomicMass",
				header: "Atomic Mass",
				// Auto-detects as "number" filter based on sample data (typeof number)
				cell: (info) => {
					const value = info.getValue() as number;
					return value?.toFixed(3) ?? "N/A";
				},
			},
			{
				accessorKey: "category",
				header: "Category",
				enableHiding:false,
				// Auto-detects as "text" filter since no options and not numeric
			},
			{
				accessorKey: "group",
				header: "Group",
				// Auto-detects as "number" filter based on accessor key pattern
				cell: (info) => info.getValue() ?? "—",
			},
			{
				accessorKey: "period",
				header: "Period",
				editable: true,
				editType: "select",
				// Auto-detects as "select" filter since it has options
				options: [
					{ label: "1", value: 1, color: "#ef4444" },
					{ label: "2", value: 2, color: "#f97316" },
					{ label: "3", value: 3, color: "#eab308" },
					{ label: "4", value: 4, color: "#22c55e" },
					{ label: "5", value: 5, color: "#06b6d4" },
					{ label: "6", value: 6, color: "#3b82f6" },
					{ label: "7", value: 7, color: "#8b5cf6" },
				],
				onEdited: handleEdit,
			},
			{
				accessorKey: "block",
				header: "Block",
				editable: true,
				editType: "select",
				// Auto-detects as "select" filter since it has options
				options: [
					{ label: "s-block", value: "s", color: "#10b981" },
					{ label: "p-block", value: "p", color: "#3b82f6" },
					{ label: "d-block", value: "d", color: "#f59e0b" },
					{ label: "f-block", value: "f", color: "#ec4899" },
				],
				onEdited: handleEdit,
			},
			{
				accessorKey: "electronConfiguration",
				header: "Electron Config",
			},
			{
				accessorKey: "density",
				header: "Density (g/cm³)",
				// Auto-detects as "number" filter based on accessor key pattern and sample data
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value?.toFixed(4) ?? "N/A";
				},
			},
			{
				accessorKey: "meltingPoint",
				header: "Melting Point (K)",
				// Auto-detects as "number" filter based on accessor key pattern and sample data
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value?.toFixed(2) ?? "N/A";
				},
			},
			{
				accessorKey: "boilingPoint",
				header: "Boiling Point (K)",
				// Auto-detects as "number" filter based on accessor key pattern and sample data
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value?.toFixed(2) ?? "N/A";
				},
			},
			{
				accessorKey: "discoveryYear",
				header: "Discovery Year",
				// Auto-detects as "number" filter based on accessor key pattern
				cell: (info) => info.getValue() ?? "Ancient",
			},
		],
		[],
	);

	return (
		<div className="p-4 h-full flex flex-col overflow-hidden">
			<div className="flex-1 min-h-0">
				<ServerDataTable
					// Data fetching
					endpoint={client.dev.$get}
					queryKey={["dev-chemical-elements"]}
					fetchFn={fetchRPC}
					// Table configuration
					columns={columns}
					saveState={SAVE_STATE_KEY}
					title="Chemical Elements"
					// Pagination
					pagination
					pageSizeOptions={[10, 25, 50, 100, 250]}
					// Features
					columnOrderable
					columnResizable
					rowVirtualization
					sortable
					filterable
					search
					rowSelectable
					fitToParentWidth
					newButton
					// Callbacks
					onSelectAction={(row, action) => {
						alert(
							`Action: ${action} on row with Atomic #${row.length}`,
						);
					}}
					initialState={{
						columnVisibility: {
							name: false,
						},
					}}
				/>
			</div>
		</div>
	);
}
