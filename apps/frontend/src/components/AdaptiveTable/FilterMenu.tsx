import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import type { Table } from "@tanstack/react-table";
import { Calendar, Filter, ListFilter, ToggleLeft, Type } from "lucide-react";
import type { AdaptiveColumnDef, FilterableColumn } from "./types";

interface FilterMenuProps<T> {
	table: Table<T>;
	filterableColumns: FilterableColumn[];
	onAddFilter: (columnId: string) => void;
	hasActiveFilters: boolean;
}

// Custom number icon component for better numeric representation
function NumberIcon({ className }: { className?: string }) {
	return (
		<span className={`font-mono font-semibold text-xs ${className ?? ""}`}>
			123
		</span>
	);
}

// Icon map for filter types
const filterTypeIcons = {
	text: Type,
	number: NumberIcon,
	date: Calendar,
	boolean: ToggleLeft,
	select: ListFilter,
};

export function FilterMenu<T>({
	table,
	filterableColumns,
	onAddFilter,
	hasActiveFilters,
}: FilterMenuProps<T>) {
	const getColumnLabel = (columnId: string) => {
		const column = table.getColumn(columnId);
		if (!column) return columnId;
		const columnDef = column.columnDef as AdaptiveColumnDef<T>;
		return typeof columnDef.header === "string"
			? columnDef.header
			: columnId;
	};

	if (filterableColumns.length === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={hasActiveFilters ? "border-primary" : ""}
				>
					<Filter className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-52" align="end">
				<div className="px-2 py-1.5">
					<p className="text-xs font-medium text-muted-foreground">
						Filter by...
					</p>
				</div>
				<DropdownMenuSeparator />
				{filterableColumns.map((filterCol) => {
					const Icon = filterTypeIcons[filterCol.filterType];
					return (
						<DropdownMenuItem
							key={filterCol.columnId}
							className="gap-2 px-2 py-1.5 cursor-pointer"
							onSelect={() => onAddFilter(filterCol.columnId)}
						>
							<Icon className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								{getColumnLabel(filterCol.columnId)}
							</span>
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
