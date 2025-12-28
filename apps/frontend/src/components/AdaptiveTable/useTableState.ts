import type { SortingState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import type { FilterState } from "./filterEngine";
import type { TableState } from "./types";
import { loadTableState, resetTableState, saveTableState } from "./utils";

interface UseTableStateOptions {
	saveStateKey?: string;
	defaultColumnOrder: string[];
	enableColumnOrderable?: boolean;
	enableColumnResizable?: boolean;
	enableColumnVisibilityToggle?: boolean;
	enableGroupable?: boolean;
	enablePagination?: boolean;
	enableSortable?: boolean;
	enableFilterable?: boolean;
	enableSearch?: boolean;
	searchQueryTtl?: number;
}

interface UseTableStateReturn {
	columnOrder: string[];
	setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
	columnSizing: Record<string, number>;
	setColumnSizing: React.Dispatch<
		React.SetStateAction<Record<string, number>>
	>;
	columnVisibility: Record<string, boolean>;
	setColumnVisibility: React.Dispatch<
		React.SetStateAction<Record<string, boolean>>
	>;
	groupBy: string | null;
	setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
	expandedGroups: Record<string, boolean>;
	setExpandedGroups: React.Dispatch<
		React.SetStateAction<Record<string, boolean>>
	>;
	perPage: number;
	setPerPage: React.Dispatch<React.SetStateAction<number>>;
	sorting: SortingState;
	setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
	filters: FilterState;
	setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
	searchQuery: string;
	setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
	resetSettings: () => void;
}

export function useTableState({
	saveStateKey,
	defaultColumnOrder,
	enableColumnOrderable,
	enableColumnResizable,
	enableColumnVisibilityToggle,
	enableGroupable,
	enablePagination,
	enableSortable,
	enableFilterable,
	enableSearch,
	searchQueryTtl = 1800,
}: UseTableStateOptions): UseTableStateReturn {
	// Initialize column order from saved state or default order
	const [columnOrder, setColumnOrder] = useState<string[]>(() => {
		if (saveStateKey && enableColumnOrderable) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (
					savedState?.columnOrder &&
					Array.isArray(savedState.columnOrder)
				) {
					// Validate that saved columns still exist
					const validColumns = savedState.columnOrder.filter((id) =>
						defaultColumnOrder.includes(id),
					);

					// Check if all saved columns are valid and count matches
					if (
						validColumns.length === savedState.columnOrder.length &&
						validColumns.length === defaultColumnOrder.length
					) {
						return validColumns;
					}

					// Reset to default if there's any mismatch
					console.warn(
						`Table state mismatch for "${saveStateKey}". Resetting to default.`,
					);
					saveTableState(saveStateKey, {
						columnOrder: defaultColumnOrder,
					});
				}
			} catch (error) {
				console.error(
					`Error loading table state for "${saveStateKey}". Resetting to default.`,
					error,
				);
				// Reset saved state to default on error
				try {
					saveTableState(saveStateKey, {
						columnOrder: defaultColumnOrder,
					});
				} catch (saveError) {
					console.error("Failed to reset table state:", saveError);
				}
			}
		}
		return defaultColumnOrder;
	});

	// Initialize column sizing from saved state
	const [columnSizing, setColumnSizing] = useState<Record<string, number>>(
		() => {
			if (saveStateKey && enableColumnResizable) {
				try {
					const savedState = loadTableState(saveStateKey);
					if (savedState?.columnSizing) {
						return savedState.columnSizing;
					}
				} catch (error) {
					console.error("Error loading column sizing:", error);
				}
			}
			return {};
		},
	);

	// Initialize column visibility from saved state
	const [columnVisibility, setColumnVisibility] = useState<
		Record<string, boolean>
	>(() => {
		if (saveStateKey && enableColumnVisibilityToggle) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (savedState?.columnVisibility) {
					return savedState.columnVisibility;
				}
			} catch (error) {
				console.error("Error loading column visibility:", error);
			}
		}
		return {};
	});

	// Initialize grouping state from saved state
	const [groupBy, setGroupBy] = useState<string | null>(() => {
		if (saveStateKey && enableGroupable) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (savedState?.groupBy !== undefined) {
					return savedState.groupBy;
				}
			} catch (error) {
				console.error("Error loading groupBy state:", error);
			}
		}
		return null;
	});

	// Initialize expanded groups state
	const [expandedGroups, setExpandedGroups] = useState<
		Record<string, boolean>
	>(() => {
		if (saveStateKey && enableGroupable) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (savedState?.expandedGroups) {
					return savedState.expandedGroups;
				}
			} catch (error) {
				console.error("Error loading expanded groups:", error);
			}
		}
		return {};
	});

	// Initialize pagination state from saved state
	const [perPage, setPerPage] = useState<number>(() => {
		if (saveStateKey && enablePagination) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (savedState?.perPage) {
					return savedState.perPage;
				}
			} catch (error) {
				console.error("Error loading perPage state:", error);
			}
		}
		return 10; // Default per page
	});

	// Initialize sorting state from saved state
	const [sorting, setSorting] = useState<SortingState>(() => {
		if (saveStateKey && enableSortable) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (savedState?.sorting) {
					return savedState.sorting;
				}
			} catch (error) {
				console.error("Error loading sorting state:", error);
			}
		}
		return [];
	});

	// Initialize filter state from saved state
	const [filters, setFilters] = useState<FilterState>(() => {
		if (saveStateKey && enableFilterable) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (savedState?.filters) {
					return savedState.filters;
				}
			} catch (error) {
				console.error("Error loading filter state:", error);
			}
		}
		return [];
	});

	// Initialize search query state from saved state with TTL check
	const [searchQuery, setSearchQuery] = useState<string>(() => {
		if (saveStateKey && enableSearch) {
			try {
				const savedState = loadTableState(saveStateKey);
				if (
					savedState?.searchQuery &&
					savedState?.searchQueryTimestamp
				) {
					// Check if TTL has expired (convert seconds to milliseconds)
					const now = Date.now();
					const elapsed =
						(now - savedState.searchQueryTimestamp) / 1000;
					if (elapsed < searchQueryTtl) {
						return savedState.searchQuery;
					}
					// TTL expired, clear the search query
				}
			} catch (error) {
				console.error("Error loading search query state:", error);
			}
		}
		return "";
	});

	// Save state whenever any state changes
	useEffect(() => {
		if (saveStateKey) {
			const state: TableState = {};
			if (enableColumnOrderable) {
				state.columnOrder = columnOrder;
			}
			if (enableColumnResizable) {
				state.columnSizing = columnSizing;
			}
			if (enableColumnVisibilityToggle) {
				state.columnVisibility = columnVisibility;
			}
			if (enableGroupable) {
				state.groupBy = groupBy;
				state.expandedGroups = expandedGroups;
			}
			if (enablePagination) {
				state.perPage = perPage;
			}
			if (enableSortable) {
				state.sorting = sorting;
			}
			if (enableFilterable) {
				state.filters = filters;
			}
			if (enableSearch) {
				state.searchQuery = searchQuery;
				state.searchQueryTimestamp = Date.now();
			}
			saveTableState(saveStateKey, state);
		}
	}, [
		saveStateKey,
		columnOrder,
		columnSizing,
		columnVisibility,
		groupBy,
		expandedGroups,
		perPage,
		sorting,
		filters,
		searchQuery,
		enableColumnOrderable,
		enableColumnResizable,
		enableColumnVisibilityToggle,
		enableGroupable,
		enablePagination,
		enableSortable,
		enableFilterable,
		enableSearch,
	]);

	const resetSettings = () => {
		if (saveStateKey) {
			// Reset all states to default
			setColumnOrder(defaultColumnOrder);
			setColumnSizing({});
			setColumnVisibility({});
			setGroupBy(null);
			setExpandedGroups({});
			setPerPage(10);
			setSorting([]);
			setFilters([]);
			setSearchQuery("");

			// Clear from localStorage
			resetTableState(saveStateKey);
		}
	};

	return {
		columnOrder,
		setColumnOrder,
		columnSizing,
		setColumnSizing,
		columnVisibility,
		setColumnVisibility,
		groupBy,
		setGroupBy,
		expandedGroups,
		setExpandedGroups,
		perPage,
		setPerPage,
		sorting,
		setSorting,
		filters,
		setFilters,
		searchQuery,
		setSearchQuery,
		resetSettings,
	};
}
