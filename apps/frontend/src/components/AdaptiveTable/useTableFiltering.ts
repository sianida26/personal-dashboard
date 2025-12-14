import { useCallback, useMemo } from "react";
import {
	applyFilters,
	createFilterCondition,
	type FilterCondition,
	type FilterState,
	type FilterType,
} from "./filterEngine";

interface UseTableFilteringProps<T> {
	data: T[];
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	accessorFns?: Record<string, (row: T) => unknown>;
}

interface UseTableFilteringReturn<T> {
	filteredData: T[];
	addFilter: (columnId: string, filterType: FilterType) => void;
	updateFilter: (filterId: string, updates: Partial<FilterCondition>) => void;
	removeFilter: (filterId: string) => void;
	clearFilters: () => void;
	hasActiveFilters: boolean;
}

export function useTableFiltering<T>({
	data,
	filters,
	onFiltersChange,
	accessorFns,
}: UseTableFilteringProps<T>): UseTableFilteringReturn<T> {
	// Apply filters to data
	const filteredData = useMemo(() => {
		return applyFilters(data, filters, accessorFns);
	}, [data, filters, accessorFns]);

	// Add a new filter - recreated when filters change to capture latest
	const addFilter = useCallback(
		(columnId: string, filterType: FilterType) => {
			const newFilter = createFilterCondition(columnId, filterType);
			onFiltersChange([...filters, newFilter]);
		},
		[filters, onFiltersChange],
	);

	// Update an existing filter - recreated when filters change to capture latest
	const updateFilter = useCallback(
		(filterId: string, updates: Partial<FilterCondition>) => {
			const updatedFilters = filters.map((filter) =>
				filter.id === filterId ? { ...filter, ...updates } : filter,
			);
			onFiltersChange(updatedFilters);
		},
		[filters, onFiltersChange],
	);

	// Remove a filter
	const removeFilter = useCallback(
		(filterId: string) => {
			const updatedFilters = filters.filter(
				(filter) => filter.id !== filterId,
			);
			onFiltersChange(updatedFilters);
		},
		[filters, onFiltersChange],
	);

	// Clear all filters
	const clearFilters = useCallback(() => {
		onFiltersChange([]);
	}, [onFiltersChange]);

	// Check if there are active filters
	const hasActiveFilters = filters.length > 0;

	return {
		filteredData,
		addFilter,
		updateFilter,
		removeFilter,
		clearFilters,
		hasActiveFilters,
	};
}
