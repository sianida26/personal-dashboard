import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import {
	type AdaptiveColumnDef,
	AdaptiveTable,
	type FilterState,
	loadTableState,
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

	// Pagination state - initialize from localStorage to sync with AdaptiveTable
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(() => {
		const savedState = loadTableState(SAVE_STATE_KEY);
		return savedState?.perPage ?? 10;
	});

	// Sorting state
	const [sorting, setSorting] = useState<SortingState>([]);

	// Filter state
	const [filters, setFilters] = useState<FilterState>([]);

	// Search state
	const [searchQuery, setSearchQuery] = useState("");

	// Build query parameters for API
	const queryParams = useMemo(() => {
		const params: {
			page: string;
			limit: string;
			q?: string;
			sort?: string;
			filter?: string;
		} = {
			page: page.toString(),
			limit: perPage.toString(),
		};

		// Add search query
		if (searchQuery) {
			params.q = searchQuery;
		}

		// Add sorting parameters (format: "column:asc" or "column:desc")
		if (sorting.length > 0) {
			params.sort = sorting
				.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`)
				.join(",");
		}

		// Add filter parameters (format: "column:value")
		if (filters.length > 0) {
			params.filter = filters
				.map((f) => `${f.columnId}:${f.value}`)
				.join(",");
		}

		return params;
	}, [page, perPage, sorting, filters, searchQuery]);

	// Fetch data from server
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["dev-chemical-elements", queryParams],
		queryFn: async () => {
			const response = await fetchRPC(
				client.dev.$get({
					query: queryParams,
				}),
			);
			return response;
		},
		placeholderData: (previousData) => previousData,
	});

	// Handlers
	const handlePaginationChange = useCallback(
		(newPerPage: number, newPage: number) => {
			setPerPage(newPerPage);
			setPage(newPage);
		},
		[],
	);

	const handleSortingChange = useCallback((newSorting: SortingState) => {
		setSorting(newSorting);
		setPage(1); // Reset to first page when sorting changes
	}, []);

	const handleFiltersChange = useCallback((newFilters: FilterState) => {
		setFilters(newFilters);
		setPage(1); // Reset to first page when filters change
	}, []);

	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
		setPage(1); // Reset to first page when search changes
	}, []);

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
				editable: true,
				editType: "text",
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

	const elements = data?.data ?? [];
	const metadata = data?._metadata;
	const totalPages = metadata?.totalPages ?? 1;
	const totalItems = metadata?.totalItems ?? 0;

	return (
		<div className="p-4 h-full flex flex-col overflow-hidden">
			<h1 className="text-2xl font-bold mb-4 flex-shrink-0">
				Chemical Elements Table
			</h1>
			<div className="flex-1 min-h-0">
				<AdaptiveTable
					columns={columns}
					data={elements}
					columnOrderable
					columnResizable
					rowVirtualization
					// Server-side pagination
					pagination
					paginationType="server"
					pageSizeOptions={[10, 25, 50, 100, 250]}
					currentPage={page}
					maxPage={totalPages}
					recordsTotal={totalItems}
					onPaginationChange={handlePaginationChange}
					// Server-side sorting
					sortable
					onSortingChange={handleSortingChange}
					// Server-side filtering
					filterable
					onFiltersChange={handleFiltersChange}
					// Server-side search
					search
					onSearchChange={handleSearchChange}
					// Loading states
					isLoading={isLoading}
					isRevalidating={isFetching && !isLoading}
					// Table features
					title="Chemical Elements"
					rowSelectable
					fitToParentWidth
					onSelectAction={(row, action) => {
						alert(
							`Action: ${action} on row with Atomic #${row.length}`,
						);
					}}
					newButton
					saveState={SAVE_STATE_KEY}
				/>
			</div>
		</div>
	);
}
