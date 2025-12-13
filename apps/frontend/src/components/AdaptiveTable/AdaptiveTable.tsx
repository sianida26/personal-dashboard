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
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailSheet } from "./DetailSheet";
import DragAlongCell from "./DragAlongCell";
import EditableCell from "./EditableCell";
import IndeterminateCheckbox from "./IndeterminateCheckbox";
import { TableHeader } from "./TableHeader";
import TableHeaderCell from "./TableHeaderCell";
import { TablePagination } from "./TablePagination";
import type { AdaptiveColumnDef, AdaptiveTableProps } from "./types";
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
	const tableHeight = props.tableHeight ?? "100%";
	const fitToParentWidth = props.fitToParentWidth ?? false;

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
			cell: ({ row }) => (
				<div className="px-1 flex items-center justify-center gap-1 ps-2.5 pe-2">
					{rowSelectable && (
						<IndeterminateCheckbox
							checked={row.getIsSelected()}
							disabled={!row.getCanSelect()}
							indeterminate={row.getIsSomeSelected()}
							onChange={row.getToggleSelectedHandler()}
						/>
					)}
					{showDetail && (
						<button
							type="button"
							onClick={() => {
								const rowIndex = row.index;
								if (props.onDetailClick) {
									props.onDetailClick(row.original, rowIndex);
								} else {
									setDetailRowIndex(rowIndex);
								}
							}}
							className="p-1 hover:bg-accent rounded transition-colors"
							aria-label="Show details"
						>
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</button>
					)}
				</div>
			),
			size: rowSelectable && showDetail ? 100 : 50,
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
	} = useTableState({
		saveStateKey: props.saveState,
		defaultColumnOrder: columnsWithDetail.map((c) => c.id as string),
		enableColumnOrderable: props.columnOrderable,
		enableColumnResizable: props.columnResizable,
		enableColumnVisibilityToggle: columnVisibilityToggle,
		enableGroupable: groupable,
		enablePagination: pagination,
		enableSortable: sortable,
	});

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
		data: props.data,
		loading,
		isGrouped: groupBy !== null,
		onPaginationChange: props.onPaginationChange,
		onPerPageChange: setPerPage,
	});

	// Use custom hook for grouping
	const { groupedData, toggleGroup } = useTableGrouping({
		groupBy,
		data: props.data,
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
		// If grouped with client pagination, show all data
		if (groupBy && pagination && paginationType === "client") {
			return props.data;
		}
		// If paginated (not grouped), use paginated data
		if (pagination && paginationType === "client") {
			return paginatedData;
		}
		// Otherwise, use original data
		return props.data;
	}, [groupBy, pagination, paginationType, paginatedData, props.data]);

	const table = useReactTable({
		data: tableData,
		columns: columnsWithDetail,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
				minSize: 60,
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
		estimateSize: () => 40,
		overscan: 10,
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
						className="border p-2"
					>
						<Skeleton className="h-8 w-full" />
					</td>
				))}
			</tr>
		));
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
				<SortableContext
					key={cell.id}
					items={columnOrder}
					strategy={horizontalListSortingStrategy}
				>
					<DragAlongCell
						key={cell.id}
						cell={cell}
						columnResizable={props.columnResizable}
						rowIndex={rowIndex}
						proportionalWidth={proportionalWidth}
					/>
				</SortableContext>
			);
		}

		return (
			<td
				key={cell.id}
				className="border p-1"
				style={{
					...(isVirtualized
						? {
								display: "flex",
								width:
									proportionalWidth ?? cell.column.getSize(),
							}
						: {
								width:
									proportionalWidth ??
									(props.columnResizable
										? `calc(var(--col-${cell.column.id}-size) * 1px)`
										: undefined),
								wordWrap: "break-word",
								whiteSpace: "normal",
							}),
				}}
			>
				<EditableCell cell={cell} rowIndex={rowIndex} />
			</td>
		);
	};

	// Render table content (unified for both orderable and regular tables)
	const renderTableContent = () => (
		<table
			className="border-collapse w-full"
			style={{
				...columnSizeVars,
				...(rowVirtualization && !loading && !groupBy
					? { display: "grid" }
					: {}),
				...(fitToParentWidth ? { tableLayout: "fixed" } : {}),
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
										table={table}
										groupable={groupable}
										groupBy={groupBy}
										onGroupByChange={setGroupBy}
										paginationType={paginationType}
										sortable={sortable}
										virtualized={
											rowVirtualization && !groupBy
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
									table={table}
									groupable={groupable}
									groupBy={groupBy}
									onGroupByChange={setGroupBy}
									paginationType={paginationType}
									sortable={sortable}
									virtualized={rowVirtualization && !groupBy}
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
				{loading
					? // Render skeleton loader
						renderSkeletonRows(
							table.getHeaderGroups()[0]?.headers.length ?? 1,
						)
					: rowVirtualization && !groupBy
						? // Render virtualized rows
							rowVirtualizer
								.getVirtualItems()
								.map((virtualRow) => {
									const row = rows[virtualRow.index];
									if (!row) return null;

									return (
										<tr
											key={row.id}
											data-index={virtualRow.index}
											style={{
												display: "flex",
												position: "absolute",
												transform: `translateY(${virtualRow.start}px)`,
												width: "100%",
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
						: groupedData && groupBy
							? // Render grouped rows
								Array.from(groupedData.entries()).map(
									([groupValue, groupItems]) => {
										const isExpanded =
											expandedGroups[groupValue] ?? true;
										const columnCount =
											table.getHeaderGroups()[0]?.headers
												.length ?? 1;

										return (
											<>
												<tr
													key={`group-${groupValue}`}
													className="bg-muted/50 hover:bg-muted/70 transition-colors"
												>
													<td
														colSpan={columnCount}
														className="border px-3 py-2"
													>
														<button
															type="button"
															onClick={() =>
																toggleGroup(
																	groupValue,
																)
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
																{
																	groupItems.length
																}
																)
															</span>
														</button>
													</td>
												</tr>
												{isExpanded &&
													groupItems.map((item) => {
														// Find the original index in props.data
														const originalIndex =
															props.data.indexOf(
																item,
															);
														const rows =
															table.getRowModel()
																.rows;
														const row =
															rows[originalIndex];
														if (!row) return null;

														return (
															<tr key={row.id}>
																{row
																	.getVisibleCells()
																	.map(
																		(
																			cell,
																		) =>
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
							: // Render ungrouped rows
								table
									.getRowModel()
									.rows.map((row, rowIndex) => (
										<tr key={row.id}>
											{row
												.getVisibleCells()
												.map((cell) =>
													renderCell(
														cell,
														rowIndex,
														false,
													),
												)}
										</tr>
									))}
			</tbody>
		</table>
	);

	// Unified render
	return (
		<div className="flex flex-col h-full">
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
			/>

			<div
				ref={tableContainerRef}
				className="flex-1 min-h-0 relative"
				style={{
					height: tableHeight,
					overflow: "hidden",
				}}
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
							: props.data.length
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
					data={props.data}
					detailRowIndex={detailRowIndex}
				/>
			)}
		</div>
	);
}

export default AdaptiveTable;
