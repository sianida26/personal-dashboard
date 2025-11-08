import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	type AdaptiveColumnDef,
	AdaptiveTable,
} from "@/components/AdaptiveTable";
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

	const [data, setData] = useState(chemicalElements);

	const handleEdit = (rowIndex: number, columnId: string, value: unknown) => {
		setData((prevData) => {
			const newData = [...prevData];
			// biome-ignore lint/suspicious/noExplicitAny: Dynamic property access
			(newData[rowIndex] as any)[columnId] = value;
			return newData;
		});
		alert("Updated!");
	};

	const columns = useMemo<AdaptiveColumnDef<ChemicalElement>[]>(
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
				editable: true,
				editType: "text",
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
				editable: true,
				editType: "select",
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
				data={data}
				columnOrderable
				columnResizable
				title="Chemical Elements"
				rowSelectable
				saveState="chemical-elements-table"
			/>
		</div>
	);
}
