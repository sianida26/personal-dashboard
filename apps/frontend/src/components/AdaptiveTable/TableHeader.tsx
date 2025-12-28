import { Badge, Button, Input } from "@repo/ui";
import type { SortingState, Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { FilterBar } from "./FilterBar";
import { FilterMenu } from "./FilterMenu";
import type { FilterCondition } from "./filterEngine";
import { TableSettingsMenu } from "./TableSettingsMenu";
import type { FilterableColumn, TableSettingsLabels } from "./types";

interface TableHeaderProps<T> {
	title?: string;
	showHeader: boolean;
	rowSelectable: boolean;
	rowSelection: Record<string, boolean>;
	table: Table<T>;
	selectActions?: Array<{ name: string; button: ReactNode }>;
	onSelectAction?: (rows: T[], actionName: string) => void;
	columnVisibilityToggle: boolean;
	groupable: boolean;
	groupBy: string | null;
	onGroupByChange: (groupBy: string | null) => void;
	paginationType: "client" | "server";
	sortable: boolean;
	sorting: SortingState;
	onSortingChange: (sorting: SortingState) => void;
	headerActions?: ReactNode;
	labels?: Partial<TableSettingsLabels>;
	// Filter props
	filterable: boolean;
	filterableColumns: FilterableColumn[];
	filters: FilterCondition[];
	onAddFilter: (columnId: string) => void;
	onUpdateFilter: (
		filterId: string,
		updates: Partial<FilterCondition>,
	) => void;
	onRemoveFilter: (filterId: string) => void;
	onClearFilters: () => void;
	// Search props
	search: boolean;
	searchValue: string;
	onSearchChange: (value: string) => void;
	// Reset settings
	onResetSettings?: () => void;
	// New button props
	newButton?: ReactNode | boolean;
	onNewButtonClick?: () => void;
}

export function TableHeader<T>({
	title,
	showHeader,
	rowSelectable,
	rowSelection,
	table,
	selectActions,
	onSelectAction,
	columnVisibilityToggle,
	groupable,
	groupBy,
	onGroupByChange,
	paginationType,
	sortable,
	onResetSettings,
	sorting,
	onSortingChange,
	headerActions,
	labels,
	filterable,
	filterableColumns,
	filters,
	onAddFilter,
	onUpdateFilter,
	onRemoveFilter,
	onClearFilters,
	search,
	searchValue,
	onSearchChange,
	newButton = true,
	onNewButtonClick,
}: TableHeaderProps<T>) {
	if (!showHeader) return null;

	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Auto-focus when search opens
	useEffect(() => {
		if (isSearchOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isSearchOpen]);

	// Handle blur with 3s delay
	const handleBlur = () => {
		if (!searchValue.trim()) {
			closeTimeoutRef.current = setTimeout(() => {
				setIsSearchOpen(false);
			}, 1000);
		}
	};

	// Cancel close timeout on focus
	const handleFocus = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
	};

	// Clear timeout on unmount
	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	// Keep search open if there's a value
	useEffect(() => {
		if (searchValue.trim()) {
			setIsSearchOpen(true);
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
				closeTimeoutRef.current = null;
			}
		}
	}, [searchValue]);

	const selectedRowsCount = rowSelectable
		? Object.keys(rowSelection).length
		: 0;
	const selectedRows = rowSelectable
		? table.getSelectedRowModel().rows.map((row) => row.original)
		: [];
	const hasActiveFilters = filters.length > 0;

	return (
		<div className="mb-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{title && (
						<h2 className="text-lg font-semibold">{title}</h2>
					)}
					{rowSelectable && selectedRowsCount > 0 && (
						<>
							<Badge variant="secondary">
								{selectedRowsCount} selected
							</Badge>
							{selectActions?.map((action) => (
								<button
									key={action.name}
									type="button"
									onClick={() => {
										if (onSelectAction) {
											onSelectAction(
												selectedRows,
												action.name,
											);
										}
									}}
								>
									{action.button}
								</button>
							))}
						</>
					)}
				</div>
				<div className="flex items-center gap-0.5">
					{search && (
						<div
							className="relative flex items-center overflow-hidden transition-all duration-300 ease-in-out"
							style={{
								width: isSearchOpen ? "16rem" : "2.25rem",
							}}
						>
							<button
								type="button"
								className="absolute left-2.5 z-10 p-0 border-0 bg-transparent cursor-pointer"
								onClick={() => setIsSearchOpen(true)}
								onMouseEnter={() => setIsSearchOpen(true)}
								aria-label="Search"
							>
								<Search className="h-4 w-4 text-muted-foreground" />
							</button>
							<Input
								ref={searchInputRef}
								type="text"
								placeholder="Search..."
								value={searchValue}
								onChange={(e) => onSearchChange(e.target.value)}
								onBlur={handleBlur}
								onFocus={handleFocus}
								className="pl-8 h-9 w-full transition-opacity duration-300"
								style={{
									opacity: isSearchOpen ? 1 : 0,
								}}
							/>
						</div>
					)}
					{filterable && filterableColumns.length > 0 && (
						<FilterMenu
							table={table}
							filterableColumns={filterableColumns}
							onAddFilter={onAddFilter}
							hasActiveFilters={hasActiveFilters}
						/>
					)}
					{columnVisibilityToggle && (
						<TableSettingsMenu
							table={table}
							columnVisibilityToggle={columnVisibilityToggle}
							groupable={groupable}
							groupBy={groupBy}
							onGroupByChange={onGroupByChange}
							paginationType={paginationType}
							sortable={sortable}
							sorting={sorting}
							onSortingChange={onSortingChange}
							labels={labels}
							onResetSettings={onResetSettings}
						/>
					)}
					{headerActions ? (
						headerActions
					) : newButton === false ? null : typeof newButton ===
						"boolean" ? (
						<Button size="sm" onClick={onNewButtonClick}>
							New
						</Button>
					) : (
						// biome-ignore lint/a11y/useKeyWithClickEvents: onClick wrapper for custom ReactNode
						// biome-ignore lint/a11y/noStaticElementInteractions: onClick wrapper for custom ReactNode
						<span onClick={onNewButtonClick}>{newButton}</span>
					)}
				</div>
			</div>
			{/* Filter chips bar */}
			{filterable && hasActiveFilters && (
				<div className="mt-3">
					<FilterBar
						filters={filters}
						table={table}
						filterableColumns={filterableColumns}
						onUpdateFilter={onUpdateFilter}
						onRemoveFilter={onRemoveFilter}
						onClearFilters={onClearFilters}
					/>
				</div>
			)}
		</div>
	);
}
