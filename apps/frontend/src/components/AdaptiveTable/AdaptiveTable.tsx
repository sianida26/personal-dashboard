// DnD Kit imports
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { Skeleton } from "@repo/ui";
import {
	type Cell,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailSheet } from "./DetailSheet";
import DragAlongCell from "./DragAlongCell";
import EditableCell from "./EditableCell";
import type { FilterType } from "./filterEngine";
import IndeterminateCheckbox from "./IndeterminateCheckbox";
import { TableHeader } from "./TableHeader";
import TableHeaderCell from "./TableHeaderCell";
import { TablePagination } from "./TablePagination";
import type {
	AdaptiveColumnDef,
	AdaptiveTableProps,
	FilterableColumn,
} from "./types";
import { useTableFiltering } from "./useTableFiltering";
import { useTableGrouping } from "./useTableGrouping";
import { useTablePagination } from "./useTablePagination";
import { useTableSorting } from "./useTableSorting";
import { useTableState } from "./useTableState";
import { ensureColumnIds } from "./utils";

export function AdaptiveTable<T>(props: AdaptiveTableProps<T>) {
	// Set default values
	const columnVisibilityToggle = props.columnVisibilityToggle ?? true;
	const showHeader = props.showHeader ?? true;
	const showDetail = props.showDetail ?? true;
	const groupable = props.groupable ?? true;
	const pagination = props.pagination ?? false;
	const paginationType = props.paginationType ?? "client";
	const loading = props.loading ?? false;
	const rowSelectable = props.rowSelectable ?? false;
	const sortable = props.sortable ?? true;
	const rowVirtualization = props.rowVirtualization ?? true;
	const rowHeight = props.rowHeight ?? 40;
	const fitToParentWidth = props.fitToParentWidth ?? false;
	const filterable = props.filterable ?? true;
	const search = props.search ?? true;

	// Reference for the scrollable container
	const tableContainerRef = useRef<HTMLDivElement>(null);

	// Track container width for fit to parent
	const [containerWidth, setContainerWidth] = useState<number>(0);

	// Update container dimensions on mount and resize
	useEffect(() => {
		if (!fitToParentWidth || !tableContainerRef.current) return;

		const updateDimensions = () => {
			if (tableContainerRef.current) {
				setContainerWidth(tableContainerRef.current.clientWidth);
			}
		};

		updateDimensions();

		const resizeObserver = new ResizeObserver(updateDimensions);
		resizeObserver.observe(tableContainerRef.current);

		return () => resizeObserver.disconnect();
	}, [fitToParentWidth]);

	// State for detail view
	const [detailRowIndex, setDetailRowIndex] = useState<number | null>(null);

	// State for row selection
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
		{},
	);

	// State for search with debounce
	const [searchValue, setSearchValue] = useState<string>("");

	// Debounced search value using useEffect for 300ms delay
	const [debouncedSearchValue, setDebouncedSearchValue] =
		useState<string>("");

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchValue(searchValue);
			props.onSearchChange?.(searchValue);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchValue, props.onSearchChange]);

	// Ensure all columns have IDs
	const columnsWithIds = useMemo(
		() => ensureColumnIds(props.columns),
		[props.columns],
	);

	// Add combined actions column (selection + detail) if either is enabled
	const columnsWithActions = useMemo(() => {
		if (!showDetail && !rowSelectable) return columnsWithIds;

		const actionsColumn: AdaptiveColumnDef<T> = {
			id: "_actions",
			header: rowSelectable
				? ({ table }) => (
						<IndeterminateCheckbox
							checked={table.getIsAllRowsSelected()}
							indeterminate={table.getIsSomeRowsSelected()}
							onChange={table.getToggleAllRowsSelectedHandler()}
						/>
					)
				: "",
			cell: ({ row }) => {
				const isSelected = row.getIsSelected();
				return (
					<div className="flex items-center justify-center gap-0.5">
						{rowSelectable && (
							<div
								className={`${isSelected ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
							>
								<IndeterminateCheckbox
									checked={isSelected}
									disabled={!row.getCanSelect()}
									indeterminate={row.getIsSomeSelected()}
									onChange={row.getToggleSelectedHandler()}
								/>
							</div>
						)}
						{showDetail && (
							<button
								type="button"
								onClick={() => {
									const rowIndex = row.index;
									if (props.onDetailClick) {
										props.onDetailClick(
											row.original,
											rowIndex,
										);
									} else {
										setDetailRowIndex(rowIndex);
									}
								}}
								className="p-0.5 hover:bg-accent rounded transition-colors opacity-0 group-hover/row:opacity-100"
								aria-label="Show details"
							>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</button>
						)}
					</div>
				);
			},
			size: rowSelectable && showDetail ? 56 : 32,
			minSize: rowSelectable && showDetail ? 56 : 32,
			enableResizing: false,
			enableHiding: false,
			enableSorting: false,
			// Column-level overrides
			orderable: false,
			resizable: false,
			visibilityToggle: false,
		};

		return [actionsColumn, ...columnsWithIds];
	}, [showDetail, rowSelectable, columnsWithIds, props]);

	// Alias for backward compatibility
	const columnsWithDetail = columnsWithActions;

	// Use custom hook for table state persistence
	const {
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
	} = useTableState({
		saveStateKey: props.saveState,
		defaultColumnOrder: columnsWithDetail.map((c) => c.id as string),
		enableColumnOrderable: props.columnOrderable,
		enableColumnResizable: props.columnResizable,
		enableColumnVisibilityToggle: columnVisibilityToggle,
		enableGroupable: groupable,
		enablePagination: pagination,
		enableSortable: sortable,
		enableFilterable: filterable,
	});

	// Build filterable columns from column definitions
	// By default, all accessor columns are filterable unless explicitly set to false
	// Filter type is auto-detected: "select" if has options, "number" for numeric accessors, otherwise "text"
	const filterableColumns = useMemo<FilterableColumn[]>(() => {
		if (!filterable) return [];

		// Helper to detect if a column is likely numeric based on accessor key or sample data
		const detectNumberType = (columnDef: AdaptiveColumnDef<T>): boolean => {
			// Check if accessorKey suggests a number (common patterns)
			if ("accessorKey" in columnDef && columnDef.accessorKey) {
				const key = String(columnDef.accessorKey).toLowerCase();
				const numericPatterns = [
					"number",
					"count",
					"total",
					"amount",
					"price",
					"cost",
					"quantity",
					"qty",
					"age",
					"year",
					"month",
					"day",
					"id",
					"index",
					"size",
					"width",
					"height",
					"weight",
					"mass",
					"density",
					"point",
					"score",
					"rating",
					"percent",
					"percentage",
					"rate",
					"ratio",
					"period",
					"group",
				];
				if (numericPatterns.some((pattern) => key.includes(pattern))) {
					return true;
				}
			}

			// Check sample data if available
			if (props.data.length > 0) {
				const firstRow = props.data[0];
				let sampleValue: unknown;

				if (
					"accessorKey" in columnDef &&
					columnDef.accessorKey &&
					firstRow
				) {
					const keys = String(columnDef.accessorKey).split(".");
					sampleValue = keys.reduce<unknown>(
						(obj, key) =>
							obj && typeof obj === "object"
								? (obj as Record<string, unknown>)[key]
								: undefined,
						firstRow,
					);
				} else if (
					"accessorFn" in columnDef &&
					columnDef.accessorFn &&
					firstRow
				) {
					try {
						sampleValue = columnDef.accessorFn(firstRow, 0);
					} catch {
						// Ignore accessor errors
					}
				}

				if (typeof sampleValue === "number") {
					return true;
				}
			}

			return false;
		};

		return columnsWithIds
			.filter((col) => {
				const columnDef = col as AdaptiveColumnDef<T>;
				// Skip internal columns like _actions
				if (col.id?.startsWith("_")) return false;
				// If explicitly set to false, exclude
				if (columnDef.filterable === false) return false;
				// If explicitly set to true, include
				if (columnDef.filterable === true) return true;
				// By default, include columns that have an accessor (accessorKey or accessorFn)
				return "accessorKey" in columnDef || "accessorFn" in columnDef;
			})
			.map((col) => {
				const columnDef = col as AdaptiveColumnDef<T>;
				// Auto-detect filter type:
				// 1. Use explicit filterType if provided
				// 2. "select" if has options
				// 3. "number" if detected as numeric
				// 4. Default to "text"
				let autoFilterType: FilterType = "text";
				if (columnDef.filterType) {
					autoFilterType = columnDef.filterType;
				} else if (columnDef.options && columnDef.options.length > 0) {
					autoFilterType = "select";
				} else if (detectNumberType(columnDef)) {
					autoFilterType = "number";
				}

				return {
					columnId: col.id as string,
					filterType: autoFilterType,
					options: columnDef.options?.map((opt) => ({
						label: opt.label,
						value: opt.value,
					})),
				};
			});
	}, [filterable, columnsWithIds, props.data]);

	// Build accessor functions for filtering
	const filterAccessorFns = useMemo(() => {
		if (!filterable) return undefined;
		const accessorFns: Record<string, (row: T) => unknown> = {};
		for (const col of columnsWithIds) {
			const columnDef = col as AdaptiveColumnDef<T>;
			// Include accessor functions for all filterable columns
			if ("accessorFn" in columnDef && columnDef.accessorFn) {
				accessorFns[col.id as string] = columnDef.accessorFn as (
					row: T,
				) => unknown;
			}
		}
		return Object.keys(accessorFns).length > 0 ? accessorFns : undefined;
	}, [filterable, columnsWithIds]);

	// Use custom hook for filtering
	const {
		filteredData: filterEngineData,
		addFilter,
		updateFilter,
		removeFilter,
		clearFilters,
	} = useTableFiltering({
		data: props.data,
		filters,
		onFiltersChange: (newFilters) => {
			setFilters(newFilters);
			props.onFiltersChange?.(newFilters);
		},
		accessorFns: filterAccessorFns,
	});

	// Apply search filtering on top of filter engine results
	const filteredData = useMemo(() => {
		if (!search || !debouncedSearchValue.trim()) {
			return filterEngineData;
		}

		const searchLower = debouncedSearchValue.toLowerCase().trim();

		return filterEngineData.filter((row) => {
			// Search through all accessor columns
			for (const col of columnsWithIds) {
				const columnDef = col as AdaptiveColumnDef<T>;
				// Skip internal columns
				if (col.id?.startsWith("_")) continue;

				let cellValue: unknown;

				// Get cell value using accessorKey or accessorFn
				if (
					"accessorKey" in columnDef &&
					columnDef.accessorKey &&
					row
				) {
					const keys = String(columnDef.accessorKey).split(".");
					cellValue = keys.reduce<unknown>(
						(obj, key) =>
							obj && typeof obj === "object"
								? (obj as Record<string, unknown>)[key]
								: undefined,
						row,
					);
				} else if (
					"accessorFn" in columnDef &&
					columnDef.accessorFn &&
					row
				) {
					try {
						cellValue = columnDef.accessorFn(row, 0);
					} catch {
						// Ignore accessor errors
					}
				}

				// Convert value to string and check if it contains search term
				if (cellValue !== undefined && cellValue !== null) {
					const stringValue = String(cellValue).toLowerCase();
					if (stringValue.includes(searchLower)) {
						return true;
					}
				}
			}
			return false;
		});
	}, [search, debouncedSearchValue, filterEngineData, columnsWithIds]);

	// Handle adding a filter for a column
	const handleAddFilter = useCallback(
		(columnId: string) => {
			const filterCol = filterableColumns.find(
				(f) => f.columnId === columnId,
			);
			if (filterCol) {
				addFilter(columnId, filterCol.filterType);
			}
		},
		[filterableColumns, addFilter],
	);

	// Use custom hooks for pagination
	const {
		currentPage,
		maxPage: calculatedMaxPage,
		paginatedData,
		shouldShowPagination,
		handlePaginationChange,
		handlePageChange,
	} = useTablePagination({
		enabled: pagination,
		type: paginationType,
		currentPage: props.currentPage,
		maxPage: props.maxPage,
		perPage,
		data: filteredData, // Use filtered data for client-side pagination
		loading,
		isGrouped: groupBy !== null,
		onPaginationChange: props.onPaginationChange,
		onPerPageChange: setPerPage,
	});

	// Use custom hook for grouping
	const { groupedData, toggleGroup } = useTableGrouping({
		groupBy,
		data: filteredData, // Use filtered data for grouping
		expandedGroups,
		setExpandedGroups,
	});

	// Use custom hook for sorting
	useTableSorting({
		sorting,
		onSortingChange: props.onSortingChange,
	});

	// Determine which data to use
	// When grouped (client-side), always use full data regardless of pagination
	const tableData = useMemo(() => {
		// If grouped with client pagination, show all filtered data
		if (groupBy && pagination && paginationType === "client") {
			return filteredData;
		}
		// If paginated (not grouped), use paginated data
		if (pagination && paginationType === "client") {
			return paginatedData;
		}
		// Otherwise, use filtered data
		return filteredData;
	}, [groupBy, pagination, paginationType, paginatedData, filteredData]);

	const table = useReactTable({
		data: tableData,
		columns: columnsWithDetail,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		// Generate unique row IDs based on data content to ensure proper re-rendering
		// when filtered data changes (prevents stale cell data from being displayed)
		getRowId: (originalRow, index) => {
			// Try to use a unique identifier from the row data, fallback to stringified content + index
			const row = originalRow as Record<string, unknown>;
			if (row.id !== undefined) return String(row.id);
			if (row._id !== undefined) return String(row._id);
			if (row.key !== undefined) return String(row.key);
			// Fallback: use first few values + index to create a unique-ish ID
			const values = Object.values(row).slice(0, 3).join("-");
			return `${values}-${index}`;
		},
		state: {
			columnOrder: props.columnOrderable ? columnOrder : undefined,
			...(props.columnResizable && { columnSizing }),
			...(columnVisibilityToggle && { columnVisibility }),
			...(rowSelectable && { rowSelection }),
			...(sortable && { sorting }),
		},
		...(props.columnOrderable && { onColumnOrderChange: setColumnOrder }),
		...(props.columnResizable && {
			onColumnSizingChange: setColumnSizing,
			columnResizeMode: "onChange" as const,
			defaultColumn: {
				minSize: 80,
				size: 150,
				maxSize: 800,
			},
		}),
		...(columnVisibilityToggle && {
			onColumnVisibilityChange: setColumnVisibility,
		}),
		...(rowSelectable && {
			enableRowSelection: true,
			onRowSelectionChange: setRowSelection,
		}),
		...(sortable && {
			onSortingChange: setSorting,
			enableSorting: true,
		}),
	});

	// Handle row selection callback
	useEffect(() => {
		if (rowSelectable && props.onSelect) {
			const selectedRows = table
				.getSelectedRowModel()
				.rows.map((row) => row.original);
			if (selectedRows.length > 0) {
				// Call onSelect with the first selected row for backward compatibility
				props.onSelect(selectedRows[0]);
			}
		}
	}, [rowSelection, rowSelectable, props, table]);

	// Handle sorting callback
	useEffect(() => {
		if (props.onSortingChange) {
			props.onSortingChange(sorting);
		}
	}, [sorting, props]);

	/**
	 * Calculate all column sizes at once at the root table level in a useMemo
	 * and pass the column sizes down as CSS variables to the <table> element.
	 * This is more performant than calling column.getSize() on every render.
	 */
	const columnSizeVars = useMemo(() => {
		if (!props.columnResizable) return {};

		const headers = table.getFlatHeaders();
		const colSizes: { [key: string]: number } = {};
		for (let i = 0; i < headers.length; i++) {
			const header = headers[i];
			if (header) {
				colSizes[`--header-${header.id}-size`] = header.getSize();
				colSizes[`--col-${header.column.id}-size`] =
					header.column.getSize();
			}
		}
		return colSizes;
	}, [
		props.columnResizable,
		// Only depend on these if columnResizable is enabled
		// eslint-disable-next-line react-hooks/exhaustive-deps
		props.columnResizable ? table.getState().columnSizingInfo : null,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		props.columnResizable ? table.getState().columnSizing : null,
	]);

	/**
	 * Calculate proportional column widths when fitToParentWidth is enabled
	 * This ensures columns are scaled to fit the container without overflow
	 */
	const getProportionalWidth = useCallback(
		(
			_columnId: string,
			originalSize: number,
		): string | number | undefined => {
			if (!fitToParentWidth || containerWidth <= 0) {
				return undefined;
			}

			const visibleColumns = table.getVisibleFlatColumns();
			const totalOriginalWidth = visibleColumns.reduce(
				(sum, col) => sum + col.getSize(),
				0,
			);

			// If total width is less than container, no need to shrink
			if (totalOriginalWidth <= containerWidth) {
				return undefined;
			}

			// Calculate percentage width
			const percentage = (originalSize / totalOriginalWidth) * 100;
			return `${percentage}%`;
		},
		[fitToParentWidth, containerWidth, table],
	);

	// Note: Row heights now auto-adjust to content, no proportional height needed

	// Handle drag end for column reordering
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			setColumnOrder((columnOrder) => {
				const oldIndex = columnOrder.indexOf(active.id as string);
				const newIndex = columnOrder.indexOf(over.id as string);
				return arrayMove(columnOrder, oldIndex, newIndex);
			});
		}
	};

	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {}),
	);

	// Setup row virtualizer
	const rows = table.getRowModel().rows;

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => tableContainerRef.current,
		estimateSize: () => rowHeight,
		overscan: 5, // Reduced overscan for better performance
		enabled: rowVirtualization && !loading && !groupBy,
	});

	// Render skeleton loader
	const renderSkeletonRows = (columnCount: number) => {
		return Array.from({ length: 6 }).map((_, rowIndex) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton rows don't need stable keys
			<tr key={`skeleton-${rowIndex}`}>
				{Array.from({ length: columnCount }).map((_, colIndex) => (
					<td
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton cells don't need stable keys
						key={`skeleton-cell-${colIndex}`}
						className="border-t p-2"
					>
						<Skeleton className="h-8 w-full" />
					</td>
				))}
			</tr>
		));
	};

	// Handle row click to show detail view
	const handleRowClick = (
		e: React.MouseEvent<HTMLTableRowElement>,
		row: T,
		rowIndex: number,
	) => {
		if (!showDetail) return;

		// Don't trigger if clicking on interactive elements
		const target = e.target as HTMLElement;
		const isInteractive =
			target.closest(
				"button, a, input, select, textarea, [role='button'], [role='checkbox']",
			) !== null;

		if (isInteractive) return;

		// Trigger detail view
		if (props.onDetailClick) {
			props.onDetailClick(row, rowIndex);
		} else {
			setDetailRowIndex(rowIndex);
		}
	};

	// Helper function to render table cells (unified for grouped and ungrouped rows)
	const renderCell = (
		cell: Cell<T, unknown>,
		rowIndex: number,
		isVirtualized: boolean,
	) => {
		const proportionalWidth = getProportionalWidth(
			cell.column.id,
			cell.column.getSize(),
		);

		if (props.columnOrderable) {
			return (
				<DragAlongCell
					key={cell.id}
					cell={cell}
					rowIndex={rowIndex}
					proportionalWidth={proportionalWidth}
					rowHeight={rowHeight}
					isRowSelected={cell.row.getIsSelected()}
				/>
			);
		}

		return (
			<td
				key={cell.id}
				className="p-1 overflow-hidden"
				style={{
					...(isVirtualized
						? {
								display: "flex",
								width:
									proportionalWidth ?? cell.column.getSize(),
								minWidth: cell.column.columnDef.minSize ?? 80,
								alignItems: "center",
								contain: "layout style",
								height: rowHeight,
							}
						: {
								width:
									proportionalWidth ?? cell.column.getSize(),
								minWidth: cell.column.columnDef.minSize ?? 80,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}),
				}}
			>
				<div className="truncate w-full">
					<EditableCell cell={cell} rowIndex={rowIndex} />
				</div>
			</td>
		);
	};

	// Render table content (unified for both orderable and regular tables)
	const renderTableContent = () => (
		<table
			className="border-collapse"
			style={{
				...columnSizeVars,
				...(rowVirtualization && !loading && !groupBy
					? { display: "grid" }
					: {}),
				// table-layout: fixed is required for column resizing to work properly
				// Without it, browser auto-calculates widths and ignores explicit width settings
				tableLayout:
					props.columnResizable || fitToParentWidth
						? "fixed"
						: undefined,
				// Set explicit table width to the sum of all column sizes for precise resizing
				width: props.columnResizable
					? table.getTotalSize()
					: fitToParentWidth
						? "100%"
						: undefined,
				minWidth: props.columnResizable
					? table.getTotalSize()
					: undefined,
			}}
		>
			<thead
				style={
					rowVirtualization && !loading && !groupBy
						? {
								display: "grid",
								position: "sticky",
								top: 0,
								zIndex: 1,
								backgroundColor: "white",
							}
						: undefined
				}
			>
				{table.getHeaderGroups().map((headerGroup) => (
					<tr
						key={headerGroup.id}
						style={
							rowVirtualization && !loading && !groupBy
								? { display: "flex", width: "100%" }
								: undefined
						}
					>
						{props.columnOrderable ? (
							<SortableContext
								items={columnOrder}
								strategy={horizontalListSortingStrategy}
							>
								{headerGroup.headers.map((header) => (
									<TableHeaderCell
										key={header.id}
										header={header}
										draggable={true}
										columnResizable={props.columnResizable}
										columnVisibilityToggle={
											columnVisibilityToggle
										}
										groupable={groupable}
										groupBy={groupBy}
										onGroupByChange={setGroupBy}
										paginationType={paginationType}
										sortable={sortable}
										virtualized={
											rowVirtualization &&
											!loading &&
											!groupBy
										}
										fitToParentWidth={fitToParentWidth}
										proportionalWidth={getProportionalWidth(
											header.column.id,
											header.getSize(),
										)}
									/>
								))}
							</SortableContext>
						) : (
							headerGroup.headers.map((header) => (
								<TableHeaderCell
									key={header.id}
									header={header}
									draggable={false}
									columnResizable={props.columnResizable}
									columnVisibilityToggle={
										columnVisibilityToggle
									}
									groupable={groupable}
									groupBy={groupBy}
									onGroupByChange={setGroupBy}
									paginationType={paginationType}
									sortable={sortable}
									virtualized={
										rowVirtualization &&
										!loading &&
										!groupBy
									}
									fitToParentWidth={fitToParentWidth}
									proportionalWidth={getProportionalWidth(
										header.column.id,
										header.getSize(),
									)}
								/>
							))
						)}
					</tr>
				))}
			</thead>
			<tbody
				className="border-b"
				style={
					rowVirtualization && !loading && !groupBy
						? {
								display: "grid",
								height: `${rowVirtualizer.getTotalSize()}px`,
								position: "relative",
							}
						: undefined
				}
			>
				{loading ? (
					// Render skeleton loader
					renderSkeletonRows(
						table.getHeaderGroups()[0]?.headers.length ?? 1,
					)
				) : rowVirtualization && !groupBy ? (
					// Render virtualized rows - wrap in SortableContext for column ordering
					props.columnOrderable ? (
						<SortableContext
							items={columnOrder}
							strategy={horizontalListSortingStrategy}
						>
							{rowVirtualizer
								.getVirtualItems()
								.map((virtualRow) => {
									const row = rows[virtualRow.index];
									if (!row) return null;

									return (
										<tr
											key={row.id}
											data-index={virtualRow.index}
											data-selected={row.getIsSelected()}
											className={`group/row transition-colors border-b hover:bg-muted/50 ${row.getIsSelected() ? "bg-muted/40" : ""} ${showDetail ? "cursor-pointer" : ""}`}
											onClick={(e) =>
												handleRowClick(
													e,
													row.original,
													virtualRow.index,
												)
											}
											style={{
												display: "flex",
												position: "absolute",
												top: 0,
												left: 0,
												width: "100%",
												height: `${rowHeight}px`,
												transform: `translateY(${virtualRow.start}px)`,
												contain: "layout style paint",
												willChange: "transform",
											}}
										>
											{row
												.getVisibleCells()
												.map((cell) =>
													renderCell(
														cell,
														virtualRow.index,
														true,
													),
												)}
										</tr>
									);
								})}
						</SortableContext>
					) : (
						rowVirtualizer.getVirtualItems().map((virtualRow) => {
							const row = rows[virtualRow.index];
							if (!row) return null;

							return (
								<tr
									key={row.id}
									data-index={virtualRow.index}
									data-selected={row.getIsSelected()}
									className={`group/row transition-colors border-b hover:bg-muted/50 ${row.getIsSelected() ? "bg-muted/40" : ""} ${showDetail ? "cursor-pointer" : ""}`}
									onClick={(e) =>
										handleRowClick(
											e,
											row.original,
											virtualRow.index,
										)
									}
									style={{
										display: "flex",
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										height: `${rowHeight}px`,
										transform: `translateY(${virtualRow.start}px)`,
										contain: "layout style paint",
										willChange: "transform",
									}}
								>
									{row
										.getVisibleCells()
										.map((cell) =>
											renderCell(
												cell,
												virtualRow.index,
												true,
											),
										)}
								</tr>
							);
						})
					)
				) : groupedData && groupBy ? (
					// Render grouped rows
					Array.from(groupedData.entries()).map(
						([groupValue, groupItems]) => {
							const isExpanded =
								expandedGroups[groupValue] ?? true;
							const columnCount =
								table.getHeaderGroups()[0]?.headers.length ?? 1;

							return (
								<>
									<tr
										key={`group-${groupValue}`}
										className="bg-muted/50 hover:bg-muted/70 transition-colors"
									>
										<td
											colSpan={columnCount}
											className="border-t border-x px-3 py-2"
										>
											<button
												type="button"
												onClick={() =>
													toggleGroup(groupValue)
												}
												className="flex items-center gap-2 w-full text-left font-medium text-sm"
											>
												<ChevronRight
													className={`h-4 w-4 text-sm transition-transform ${
														isExpanded
															? "rotate-90"
															: ""
													}`}
												/>
												<span className="text-sm">
													{groupValue} (
													{groupItems.length})
												</span>
											</button>
										</td>
									</tr>
									{isExpanded &&
										groupItems.map((item) => {
											// Find the original index in props.data
											const originalIndex =
												props.data.indexOf(item);
											const rows =
												table.getRowModel().rows;
											const row = rows[originalIndex];
											if (!row) return null;

											return (
												<tr
													key={row.id}
													data-selected={row.getIsSelected()}
													className={`group/row transition-colors border-b hover:bg-muted/50 ${row.getIsSelected() ? "bg-muted/40" : ""} ${showDetail ? "cursor-pointer" : ""}`}
													onClick={(e) =>
														handleRowClick(
															e,
															row.original,
															originalIndex,
														)
													}
												>
													{row
														.getVisibleCells()
														.map((cell) =>
															renderCell(
																cell,
																originalIndex,
																false,
															),
														)}
												</tr>
											);
										})}
								</>
							);
						},
					)
				) : (
					// Render ungrouped rows
					table
						.getRowModel()
						.rows.map((row, rowIndex) => (
							<tr
								key={row.id}
								data-selected={row.getIsSelected()}
								className={`group/row transition-colors border-b hover:bg-muted/50 ${row.getIsSelected() ? "bg-muted/40" : ""} ${showDetail ? "cursor-pointer" : ""}`}
								onClick={(e) =>
									handleRowClick(e, row.original, rowIndex)
								}
							>
								{row
									.getVisibleCells()
									.map((cell) =>
										renderCell(cell, rowIndex, false),
									)}
							</tr>
						))
				)}
			</tbody>
		</table>
	);

	// Unified render
	return (
		<div className="flex flex-col h-full">
			{/* Revalidating indicator */}
			{props.isRevalidating && (
				<div className="absolute w-full">
					<div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-center py-3 pointer-events-none">
						<div className="flex items-center gap-2.5 bg-primary rounded-lg px-4 py-2 shadow-lg pointer-events-auto">
							<Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
							<span className="text-sm font-semibold text-primary-foreground">
								{props.revalidatingText ?? "Updating data..."}
							</span>
						</div>
					</div>
				</div>
			)}
			<TableHeader
				title={props.title}
				showHeader={showHeader}
				rowSelectable={rowSelectable}
				rowSelection={rowSelection}
				table={table}
				selectActions={props.selectActions}
				onSelectAction={props.onSelectAction}
				columnVisibilityToggle={columnVisibilityToggle}
				groupable={groupable}
				groupBy={groupBy}
				onGroupByChange={setGroupBy}
				paginationType={paginationType}
				sortable={sortable}
				sorting={sorting}
				onSortingChange={setSorting}
				headerActions={props.headerActions}
				labels={props.labels}
				filterable={filterable}
				filterableColumns={filterableColumns}
				filters={filters}
				onAddFilter={handleAddFilter}
				onUpdateFilter={updateFilter}
				onRemoveFilter={removeFilter}
				onClearFilters={clearFilters}
				search={search}
				searchValue={searchValue}
				onSearchChange={setSearchValue}
			/>

			<div
				ref={tableContainerRef}
				className="flex-1 min-h-0 overflow-auto relative"
			>
				{props.columnOrderable ? (
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToHorizontalAxis]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
					>
						{renderTableContent()}
					</DndContext>
				) : (
					renderTableContent()
				)}
			</div>

			{/* Pagination */}
			{shouldShowPagination && (
				<TablePagination
					currentPage={currentPage}
					perPage={perPage}
					maxPage={calculatedMaxPage}
					recordsTotal={props.recordsTotal}
					totalRecords={
						paginationType === "server"
							? (props.recordsTotal ?? 0)
							: filteredData.length
					}
					loading={loading}
					onPageChange={handlePageChange}
					onPerPageChange={handlePaginationChange}
				/>
			)}

			{/* Detail Sheet */}
			{showDetail && !props.onDetailClick && (
				<DetailSheet
					open={detailRowIndex !== null}
					onOpenChange={(open) => {
						if (!open) setDetailRowIndex(null);
					}}
					columns={columnsWithIds}
					data={filteredData}
					detailRowIndex={detailRowIndex}
				/>
			)}
		</div>
	);
}

export default AdaptiveTable;
