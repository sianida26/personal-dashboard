import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
	type Cell,
	type ColumnDef,
	type Header,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";

// DnD Kit imports
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	type DragEndEvent,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type AdaptiveTableProps<T> = {
	columns: ColumnDef<T>[];
	data: T[];
	columnOrderable?: boolean;
	saveState?: string; // Unique key to save/load table state
};

// Helper function to ensure all columns have IDs
function ensureColumnIds<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
	return columns.map((col, index) => {
		if (col.id) return col;
		
		// Try to use accessorKey as ID if available
		if ('accessorKey' in col && col.accessorKey) {
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
}: {
	header: Header<T, unknown>;
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
		width: header.column.getSize(),
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<th colSpan={header.colSpan} ref={setNodeRef} style={style} className="border">
			{header.isPlaceholder
				? null
				: flexRender(header.column.columnDef.header, header.getContext())}
			<button type="button" {...attributes} {...listeners} className="ml-2 cursor-grab active:cursor-grabbing">
				🟰
			</button>
		</th>
	);
};

// Drag along cell component
const DragAlongCell = <T,>({ cell }: { cell: Cell<T, unknown> }) => {
	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
	});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		position: "relative",
		transform: CSS.Translate.toString(transform),
		transition: "width transform 0.2s ease-in-out",
		width: cell.column.getSize(),
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
				if (savedState?.columnOrder && Array.isArray(savedState.columnOrder)) {
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
					saveTableState(props.saveState, { columnOrder: defaultOrder });
				}
			} catch (error) {
				console.error(
					`Error loading table state for "${props.saveState}". Resetting to default.`,
					error,
				);
				// Reset saved state to default on error
				try {
					saveTableState(props.saveState, { columnOrder: defaultOrder });
				} catch (saveError) {
					console.error("Failed to reset table state:", saveError);
				}
			}
		}
		
		return defaultOrder;
	});

	// Save state whenever columnOrder changes
	useEffect(() => {
		if (props.saveState && props.columnOrderable) {
			saveTableState(props.saveState, { columnOrder });
		}
	}, [columnOrder, props.saveState, props.columnOrderable]);

	const table = useReactTable({
		data: props.data,
		columns: columnsWithIds,
		getCoreRowModel: getCoreRowModel(),
		state: {
			columnOrder: props.columnOrderable ? columnOrder : undefined,
		},
		onColumnOrderChange: props.columnOrderable ? setColumnOrder : undefined,
	});

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
					<table className="border-collapse">
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									<SortableContext
										items={columnOrder}
										strategy={horizontalListSortingStrategy}
									>
										{headerGroup.headers.map((header) => (
											<DraggableTableHeader key={header.id} header={header} />
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
											strategy={horizontalListSortingStrategy}
										>
											<DragAlongCell key={cell.id} cell={cell} />
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
			<table className="border-collapse">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th key={header.id} className="border">
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<td key={cell.id} className="border">
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
