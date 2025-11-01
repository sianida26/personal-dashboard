import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { AdaptiveTable } from "@/components/AdaptiveTable";
import { usePermissions } from "@/hooks/useAuth";
import {
	type ChemicalElement,
	chemicalElements,
} from "@/utils/tempChemicalElements";

export const Route = createFileRoute("/_dashboardLayout/dev")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	usePermissions("dev-routes");

	const columns = useMemo<ColumnDef<ChemicalElement>[]>(
		() => [
			{
				accessorKey: "atomicNumber",
				header: "Atomic #",
			},
			{
				accessorKey: "symbol",
				header: "Symbol",
			},
			{
				accessorKey: "name",
				header: "Name",
			},
			{
				accessorKey: "atomicMass",
				header: "Atomic Mass",
				cell: (info) => {
					const value = info.getValue() as number;
					return value?.toFixed(3) ?? "N/A";
				},
			},
			{
				accessorKey: "category",
				header: "Category",
			},
			{
				accessorKey: "group",
				header: "Group",
				cell: (info) => info.getValue() ?? "—",
			},
			{
				accessorKey: "period",
				header: "Period",
			},
			{
				accessorKey: "block",
				header: "Block",
			},
			{
				accessorKey: "electronConfiguration",
				header: "Electron Config",
			},
			{
				accessorKey: "density",
				header: "Density (g/cm³)",
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value?.toFixed(4) ?? "N/A";
				},
			},
			{
				accessorKey: "meltingPoint",
				header: "Melting Point (K)",
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value?.toFixed(2) ?? "N/A";
				},
			},
			{
				accessorKey: "boilingPoint",
				header: "Boiling Point (K)",
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value?.toFixed(2) ?? "N/A";
				},
			},
			{
				accessorKey: "discoveryYear",
				header: "Discovery Year",
				cell: (info) => info.getValue() ?? "Ancient",
			},
		],
		[],
	);

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Chemical Elements Table</h1>
			<AdaptiveTable 
				columns={columns} 
				data={chemicalElements} 
				columnOrderable 
				saveState="chemical-elements-table"
			/>
		</div>
	);
}
