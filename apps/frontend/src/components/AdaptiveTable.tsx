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
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@repo/ui";
import {
	type Cell,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type Header,
	useReactTable,
} from "@tanstack/react-table";
import { type CSSProperties, useEffect, useMemo, useState } from "react";

type AdaptiveTableProps<T> = {
	columns: ColumnDef<T>[];
	data: T[];
	columnOrderable?: boolean;
	columnResizable?: boolean;
	saveState?: string; // Unique key to save/load table state
};

// Helper function to ensure all columns have IDs
function ensureColumnIds<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
	return columns.map((col, index) => {
		if (col.id) return col;

		// Try to use accessorKey as ID if available
		if ("accessorKey" in col && col.accessorKey) {
			return { ...col, id: String(col.accessorKey) };
		}

		// Fallback to index-based ID
		return { ...col, id: `column_${index}` };
	});
}

// Helper functions for localStorage
const STORAGE_PREFIX = "adaptive-table-";

interface TableState {
	columnOrder?: string[];
	columnSizing?: Record<string, number>;
}

function getStorageKey(saveKey: string): string {
	return `${STORAGE_PREFIX}${saveKey}`;
}

function loadTableState(saveKey: string): TableState | null {
	try {
		const stored = localStorage.getItem(getStorageKey(saveKey));
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error("Failed to load table state:", error);
		return null;
	}
}

function saveTableState(saveKey: string, state: TableState): void {
	try {
		localStorage.setItem(getStorageKey(saveKey), JSON.stringify(state));
	} catch (error) {
		console.error("Failed to save table state:", error);
	}
}

// Draggable header component
const DraggableTableHeader = <T,>({
	header,
	columnResizable,
	table,
}: {
	header: Header<T, unknown>;
	columnResizable?: boolean;
	table: ReturnType<typeof useReactTable<T>>;
}) => {
	const { attributes, isDragging, listeners, setNodeRef, transform } =
		useSortable({
			id: header.column.id,
		});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		position: "relative",
		transform: CSS.Translate.toString(transform),
		transition: "width transform 0.2s ease-in-out",
		whiteSpace: "nowrap",
		width: columnResizable
			? `calc(var(--header-${header.id}-size) * 1px)`
			: header.column.getSize(),
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<th
					colSpan={header.colSpan}
					ref={setNodeRef}
					style={style}
					className="border relative"
				>
					<div className="flex items-center">
						{header.isPlaceholder
							? null
							: flexRender(
									header.column.columnDef.header,
									header.getContext(),
								)}
						<button
							type="button"
							{...attributes}
							{...listeners}
							className="ml-2 cursor-grab active:cursor-grabbing"
						>
							🟰
						</button>
					</div>
					{columnResizable && (
						<button
							type="button"
							onDoubleClick={() => header.column.resetSize()}
							onMouseDown={header.getResizeHandler()}
							onTouchStart={header.getResizeHandler()}
							className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-blue-500 border-0 p-0 ${
								header.column.getIsResizing()
									? "bg-blue-500"
									: "bg-transparent"
							}`}
							style={{
								transform: header.column.getIsResizing()
									? `translateX(${
											table.getState().columnSizingInfo
												.deltaOffset ?? 0
										}px)`
									: "",
							}}
							aria-label="Resize column"
						>
							<div className="w-px h-full bg-gray-300 mx-auto pointer-events-none" />
						</button>
					)}
				</th>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>Dummy Menu Item</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

// Drag along cell component
const DragAlongCell = <T,>({
	cell,
	columnResizable,
}: {
	cell: Cell<T, unknown>;
	columnResizable?: boolean;
}) => {
	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
	});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		position: "relative",
		transform: CSS.Translate.toString(transform),
		transition: "width transform 0.2s ease-in-out",
		width: columnResizable
			? `calc(var(--col-${cell.column.id}-size) * 1px)`
			: cell.column.getSize(),
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<td style={style} ref={setNodeRef} className="border">
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</td>
	);
};

export function AdaptiveTable<T>(props: AdaptiveTableProps<T>) {
	// Ensure all columns have IDs
	const columnsWithIds = useMemo(
		() => ensureColumnIds(props.columns),
		[props.columns],
	);

	// Initialize column order from saved state or default order
	const [columnOrder, setColumnOrder] = useState<string[]>(() => {
		const defaultOrder = columnsWithIds.map((c) => c.id as string);

		// Load saved state if saveState key is provided
		if (props.saveState) {
			try {
				const savedState = loadTableState(props.saveState);
				if (
					savedState?.columnOrder &&
					Array.isArray(savedState.columnOrder)
				) {
					// Validate that saved columns still exist
					const validColumns = savedState.columnOrder.filter((id) =>
						defaultOrder.includes(id),
					);

					// Check if all saved columns are valid and count matches
					// If there's a mismatch, reset to default
					if (
						validColumns.length === savedState.columnOrder.length &&
						validColumns.length === defaultOrder.length
					) {
						return validColumns;
					}

					// Reset to default if there's any mismatch
					console.warn(
						`Table state mismatch for "${props.saveState}". Resetting to default.`,
					);
					saveTableState(props.saveState, {
						columnOrder: defaultOrder,
					});
				}
			} catch (error) {
				console.error(
					`Error loading table state for "${props.saveState}". Resetting to default.`,
					error,
				);
				// Reset saved state to default on error
				try {
					saveTableState(props.saveState, {
						columnOrder: defaultOrder,
					});
				} catch (saveError) {
					console.error("Failed to reset table state:", saveError);
				}
			}
		}

		return defaultOrder;
	});

	// Initialize column sizing from saved state
	const [columnSizing, setColumnSizing] = useState<Record<string, number>>(
		() => {
			if (props.saveState && props.columnResizable) {
				try {
					const savedState = loadTableState(props.saveState);
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

	// Save state whenever columnOrder or columnSizing changes
	useEffect(() => {
		if (props.saveState) {
			const state: TableState = {};
			if (props.columnOrderable) {
				state.columnOrder = columnOrder;
			}
			if (props.columnResizable) {
				state.columnSizing = columnSizing;
			}
			saveTableState(props.saveState, state);
		}
	}, [
		columnOrder,
		columnSizing,
		props.saveState,
		props.columnOrderable,
		props.columnResizable,
	]);

	const table = useReactTable({
		data: props.data,
		columns: columnsWithIds,
		getCoreRowModel: getCoreRowModel(),
		state: {
			columnOrder: props.columnOrderable ? columnOrder : undefined,
			...(props.columnResizable && { columnSizing }),
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
	});

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

	// Render orderable table
	if (props.columnOrderable) {
		return (
			<DndContext
				collisionDetection={closestCenter}
				modifiers={[restrictToHorizontalAxis]}
				onDragEnd={handleDragEnd}
				sensors={sensors}
			>
				<div>
					<table className="border-collapse" style={columnSizeVars}>
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									<SortableContext
										items={columnOrder}
										strategy={horizontalListSortingStrategy}
									>
										{headerGroup.headers.map((header) => (
											<DraggableTableHeader
												key={header.id}
												header={header}
												columnResizable={
													props.columnResizable
												}
												table={table}
											/>
										))}
									</SortableContext>
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<SortableContext
											key={cell.id}
											items={columnOrder}
											strategy={
												horizontalListSortingStrategy
											}
										>
											<DragAlongCell
												key={cell.id}
												cell={cell}
												columnResizable={
													props.columnResizable
												}
											/>
										</SortableContext>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</DndContext>
		);
	}

	// Render regular table
	return (
		<div>
			<table className="border-collapse" style={columnSizeVars}>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<ContextMenu key={header.id}>
									<ContextMenuTrigger asChild>
										<th
											className="border relative"
											style={{
												width: props.columnResizable
													? `calc(var(--header-${header.id}-size) * 1px)`
													: undefined,
											}}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext(),
													)}
											{props.columnResizable && (
												<button
													type="button"
													onDoubleClick={() =>
														header.column.resetSize()
													}
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-blue-500 border-0 p-0 ${
														header.column.getIsResizing()
															? "bg-blue-500"
															: "bg-transparent"
													}`}
													style={{
														transform:
															header.column.getIsResizing()
																? `translateX(${
																		table.getState()
																			.columnSizingInfo
																			.deltaOffset ??
																		0
																	}px)`
																: "",
													}}
													aria-label="Resize column"
												>
													<div className="w-px h-full bg-gray-300 mx-auto pointer-events-none" />
												</button>
											)}
										</th>
									</ContextMenuTrigger>
									<ContextMenuContent>
										<ContextMenuItem>
											Dummy Menu Item
										</ContextMenuItem>
									</ContextMenuContent>
								</ContextMenu>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<td
									key={cell.id}
									className="border"
									style={{
										width: props.columnResizable
											? `calc(var(--col-${cell.column.id}-size) * 1px)`
											: undefined,
									}}
								>
									{flexRender(
										cell.column.columnDef.cell,
										cell.getContext(),
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default AdaptiveTable;
