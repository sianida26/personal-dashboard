import { Button } from "@repo/ui";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { FilterChip } from "./FilterChip";
import type { FilterCondition } from "./filterEngine";
import type { FilterableColumn } from "./types";

interface FilterBarProps<T> {
	filters: FilterCondition[];
	table: Table<T>;
	filterableColumns: FilterableColumn[];
	onUpdateFilter: (
		filterId: string,
		updates: Partial<FilterCondition>,
	) => void;
	onRemoveFilter: (filterId: string) => void;
	onClearFilters: () => void;
}

export function FilterBar<T>({
	filters,
	table,
	filterableColumns,
	onUpdateFilter,
	onRemoveFilter,
	onClearFilters,
}: FilterBarProps<T>) {
	if (filters.length === 0) return null;

	return (
		<div className="flex items-center gap-2 flex-wrap pb-3">
			{filters.map((filter) => (
				<FilterChip
					key={filter.id}
					filter={filter}
					table={table}
					filterableColumns={filterableColumns}
					onUpdate={(updates) => onUpdateFilter(filter.id, updates)}
					onRemove={() => onRemoveFilter(filter.id)}
				/>
			))}
			{filters.length > 1 && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onClearFilters}
					className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
				>
					<X className="h-3 w-3 mr-1" />
					Clear all
				</Button>
			)}
		</div>
	);
}
