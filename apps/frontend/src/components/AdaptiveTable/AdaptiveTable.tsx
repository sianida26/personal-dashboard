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
	Badge,
	Button,
	Checkbox,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollArea,
	Select,
	Separator,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Skeleton,
} from "@repo/ui";
import {
	type Cell,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type Header,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import {
	type CSSProperties,
	type HTMLProps,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

// Extended column definition for adaptive table
export type AdaptiveColumnDef<T> = ColumnDef<T> & {
	editable?: boolean;
	onEdited?: (rowIndex: number, columnId: string, value: unknown) => void;
	editType?: "text" | "select";
	options?: Array<{
		label: string;
		value: string | number;
		color?: string;
	}>;
	customOptionComponent?: (option: {
		label: string;
		value: string | number;
		color?: string;
	}) => ReactNode;
	cellClassName?: string;
	getCellColor?: (value: unknown) => string | undefined;
	// Column-level overrides for table settings
	orderable?: boolean; // Override columnOrderable for this column
	resizable?: boolean; // Override columnResizable for this column
	visibilityToggle?: boolean; // Override columnVisibilityToggle for this column
};

type AdaptiveTableProps<T> = {
	columns: AdaptiveColumnDef<T>[];
	data: T[];
	columnOrderable?: boolean;
	columnResizable?: boolean;
	columnVisibilityToggle?: boolean; // Default: true
	groupable?: boolean; // Default: true
	saveState?: string; // Unique key to save/load table state
	// Header section props
	title?: string;
	headerActions?: ReactNode;
	showHeader?: boolean; // Default: true
	// Detail view props
	showDetail?: boolean; // Default: true
	onDetailClick?: (row: T, rowIndex: number) => void;
	// Pagination props
	pagination?: boolean; // Default: false
	paginationType?: "client" | "server"; // Default: "client"
	onPaginationChange?: (perPage: number, currentPage: number) => void;
	currentPage?: number;
	recordsTotal?: number; // Total records count (shows "X of Y records")
	maxPage?: number; // Mandatory if pagination is true
	loading?: boolean; // Default: false, shows skeleton loader
	// Row selection props
	rowSelectable?: boolean; // Default: false
	selectActions?: Array<{ name: string; button: ReactNode }>;
	onSelect?: (row: T) => void;
	onSelectAction?: (rows: T[], actionName: string) => void;
};

// Helper function to ensure all columns have IDs
function ensureColumnIds<T>(
	columns: AdaptiveColumnDef<T>[],
): AdaptiveColumnDef<T>[] {
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
	columnVisibility?: Record<string, boolean>;
	groupBy?: string | null;
	expandedGroups?: Record<string, boolean>;
	perPage?: number;
}

// IndeterminateCheckbox component for row selection
function IndeterminateCheckbox({
	indeterminate,
	className = "",
	...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (typeof indeterminate === "boolean" && ref.current) {
			ref.current.indeterminate = !rest.checked && indeterminate;
		}
	}, [ref, indeterminate, rest.checked]);

	return (
		<input
			type="checkbox"
			ref={ref}
			className={`cursor-pointer ${className}`}
			{...rest}
		/>
	);
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
	columnVisibilityToggle,
	table,
	groupable,
	groupBy,
	onGroupByChange,
	paginationType,
}: {
	header: Header<T, unknown>;
	columnResizable?: boolean;
	columnVisibilityToggle?: boolean;
	table: ReturnType<typeof useReactTable<T>>;
	groupable?: boolean;
	groupBy?: string | null;
	onGroupByChange?: (columnId: string | null) => void;
	paginationType?: "client" | "server";
}) => {
	const columnDef = header.column.columnDef as AdaptiveColumnDef<T>;
	const isActionsColumn = header.column.id === "_actions";

	// Disable grouping for server-side pagination
	const canGroup = groupable && paginationType !== "server";

	// Check column-level overrides
	const isOrderable = columnDef.orderable ?? true; // Default to true if not specified
	const isResizable =
		(columnDef.resizable ?? columnResizable) && !isActionsColumn;
	const hasVisibilityToggle =
		(columnDef.visibilityToggle ?? columnVisibilityToggle) &&
		!isActionsColumn;

	const { attributes, isDragging, listeners, setNodeRef, transform } =
		useSortable({
			id: header.column.id,
			disabled: isActionsColumn || !isOrderable,
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
						{!isActionsColumn && isOrderable && (
							<button
								type="button"
								{...attributes}
								{...listeners}
								className="ml-2 cursor-grab active:cursor-grabbing"
							>
								🟰
							</button>
						)}
					</div>
					{isResizable && (
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
				{hasVisibilityToggle && (
					<ContextMenuItem
						onSelect={() => header.column.toggleVisibility(false)}
					>
						Hide column
					</ContextMenuItem>
				)}
				{canGroup && !isActionsColumn && (
					<>
						{hasVisibilityToggle && <Separator />}
						<ContextMenuItem
							onSelect={() => {
								if (onGroupByChange) {
									onGroupByChange(
										groupBy === header.column.id
											? null
											: header.column.id,
									);
								}
							}}
						>
							{groupBy === header.column.id
								? "Ungroup"
								: "Group by this column"}
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
};

// Editable cell component
const EditableCell = <T,>({
	cell,
	rowIndex,
}: {
	cell: Cell<T, unknown>;
	rowIndex: number;
}) => {
	const columnDef = cell.column.columnDef as AdaptiveColumnDef<T>;
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(cell.getValue());

	const handleSave = () => {
		if (columnDef.onEdited) {
			columnDef.onEdited(rowIndex, cell.column.id, value);
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setValue(cell.getValue());
			setIsEditing(false);
		}
	};

	const handleSelectOption = (optionValue: string | number) => {
		setValue(optionValue);
		if (columnDef.onEdited) {
			columnDef.onEdited(rowIndex, cell.column.id, optionValue);
		}
		setIsEditing(false);
	};

	// Helper to get color for current value
	const getColorForValue = () => {
		if (columnDef.getCellColor) {
			return columnDef.getCellColor(value);
		}
		if (columnDef.options) {
			const option = columnDef.options.find(
				(opt) => String(opt.value) === String(value),
			);
			return option?.color;
		}
		return undefined;
	};

	if (!columnDef.editable) {
		return <>{flexRender(columnDef.cell, cell.getContext())}</>;
	}

	// Render as chip/badge for editable cells
	const cellColor = getColorForValue();
	const displayValue =
		columnDef.options?.find((opt) => String(opt.value) === String(value))
			?.label || String(value ?? "");

	// For select type, use Popover with menu
	if (columnDef.editType === "select") {
		return (
			<Popover open={isEditing} onOpenChange={setIsEditing}>
				<PopoverTrigger asChild>
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="cursor-pointer hover:bg-accent/50 px-2 py-1 min-h-[2rem] flex items-center justify-between w-full text-left group"
					>
						<Badge
							variant="secondary"
							className={columnDef.cellClassName}
							style={
								cellColor
									? {
											backgroundColor: cellColor,
											color: "white",
										}
									: undefined
							}
						>
							{displayValue}
						</Badge>
						<ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto min-w-[120px] p-0.5"
					align="start"
				>
					<div className="flex flex-col gap-0.5">
						{columnDef.options?.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => handleSelectOption(option.value)}
								className="text-left px-2 py-1 hover:bg-accent rounded-sm text-sm transition-colors"
							>
								{columnDef.customOptionComponent ? (
									columnDef.customOptionComponent(option)
								) : (
									<Badge
										variant="secondary"
										style={
											option.color
												? {
														backgroundColor:
															option.color,
														color: "white",
													}
												: undefined
										}
									>
										{option.label}
									</Badge>
								)}
							</button>
						))}
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	// For text input, show input on click with outline
	if (isEditing) {
		return (
			<input
				type="text"
				value={String(value ?? "")}
				onChange={(e) => setValue(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				// biome-ignore lint/a11y/noAutofocus: required for inline editing
				autoFocus
				className="w-full h-full px-2 py-1 outline outline-2 outline-blue-500 bg-transparent"
			/>
		);
	}

	// Text type shows plain value, not a chip
	return (
		<button
			type="button"
			onClick={() => setIsEditing(true)}
			className="cursor-pointer hover:bg-accent/50 px-2 py-1 min-h-[2rem] flex items-center w-full text-left"
		>
			{displayValue}
		</button>
	);
};

// Detail cell component for side panel
const DetailCell = <T,>({
	column,
	value,
	rowIndex,
}: {
	column: AdaptiveColumnDef<T>;
	value: unknown;
	rowIndex: number;
	row: T;
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);

	const handleSave = () => {
		if (column.onEdited) {
			column.onEdited(rowIndex, column.id as string, editValue);
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setEditValue(value);
			setIsEditing(false);
		}
	};

	const handleSelectOption = (optionValue: string | number) => {
		setEditValue(optionValue);
		if (column.onEdited) {
			column.onEdited(rowIndex, column.id as string, optionValue);
		}
		setIsEditing(false);
	};

	// Helper to get color for current value
	const getColorForValue = () => {
		if (column.getCellColor) {
			return column.getCellColor(editValue);
		}
		if (column.options) {
			const option = column.options.find(
				(opt) => String(opt.value) === String(editValue),
			);
			return option?.color;
		}
		return undefined;
	};

	// If not editable, just display the value
	if (!column.editable) {
		// For select type, display as chip even if not editable
		if (column.editType === "select" && column.options) {
			const option = column.options.find(
				(opt) => String(opt.value) === String(value),
			);
			const cellColor = option?.color || getColorForValue();
			const displayValue = option?.label || String(value ?? "");

			return (
				<Badge
					variant="secondary"
					className={column.cellClassName}
					style={
						cellColor
							? {
									backgroundColor: cellColor,
									color: "white",
								}
							: undefined
					}
				>
					{displayValue}
				</Badge>
			);
		}
		return <span>{String(value ?? "")}</span>;
	}

	// For editable select type, use Popover with menu
	if (column.editType === "select") {
		const cellColor = getColorForValue();
		const displayValue =
			column.options?.find(
				(opt) => String(opt.value) === String(editValue),
			)?.label || String(editValue ?? "");

		return (
			<Popover open={isEditing} onOpenChange={setIsEditing}>
				<PopoverTrigger asChild>
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="cursor-pointer hover:bg-accent/50 px-2 py-1 min-h-[2rem] flex items-center justify-between w-full text-left group"
					>
						<Badge
							variant="secondary"
							className={column.cellClassName}
							style={
								cellColor
									? {
											backgroundColor: cellColor,
											color: "white",
										}
									: undefined
							}
						>
							{displayValue}
						</Badge>
						<ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto min-w-[120px] p-0.5"
					align="start"
				>
					<div className="flex flex-col gap-0.5">
						{column.options?.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => handleSelectOption(option.value)}
								className="text-left px-2 py-1 hover:bg-accent rounded-sm text-sm transition-colors"
							>
								{column.customOptionComponent ? (
									column.customOptionComponent(option)
								) : (
									<Badge
										variant="secondary"
										style={
											option.color
												? {
														backgroundColor:
															option.color,
														color: "white",
													}
												: undefined
										}
									>
										{option.label}
									</Badge>
								)}
							</button>
						))}
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	// For text input, show input on click with outline
	if (isEditing) {
		return (
			<input
				type="text"
				value={String(editValue ?? "")}
				onChange={(e) => setEditValue(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				// biome-ignore lint/a11y/noAutofocus: required for inline editing
				autoFocus
				className="w-full h-full px-2 py-1 outline outline-2 outline-blue-500 bg-transparent"
			/>
		);
	}

	// Text type shows plain value
	return (
		<button
			type="button"
			onClick={() => setIsEditing(true)}
			className="cursor-pointer hover:bg-accent/50 px-2 py-1 min-h-[2rem] flex items-center w-full text-left"
		>
			{String(editValue ?? "")}
		</button>
	);
};

// Drag along cell component
const DragAlongCell = <T,>({
	cell,
	columnResizable,
	rowIndex,
}: {
	cell: Cell<T, unknown>;
	columnResizable?: boolean;
	rowIndex: number;
}) => {
	const columnDef = cell.column.columnDef as AdaptiveColumnDef<T>;
	const isActionsColumn = cell.column.id === "_actions";

	// Check column-level override for orderable
	const isOrderable = columnDef.orderable ?? true; // Default to true if not specified

	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
		disabled: isActionsColumn || !isOrderable,
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
			<EditableCell cell={cell} rowIndex={rowIndex} />
		</td>
	);
};

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

	// State for detail view
	const [detailRowIndex, setDetailRowIndex] = useState<number | null>(null);

	// State for row selection
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
		{},
	);

	// Pagination state
	const [internalCurrentPage, setInternalCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState<number>(() => {
		if (props.saveState && pagination) {
			try {
				const savedState = loadTableState(props.saveState);
				if (savedState?.perPage) {
					return savedState.perPage;
				}
			} catch (error) {
				console.error("Error loading perPage state:", error);
			}
		}
		return 10; // Default per page
	});

	const currentPage = props.currentPage ?? internalCurrentPage;

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
				<div className="px-1 flex items-center justify-center gap-1">
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
							<ChevronRight className="h-4 w-4 text-gray-500" />
						</button>
					)}
				</div>
			),
			size: rowSelectable && showDetail ? 80 : 50,
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

	// Initialize column order from saved state or default order
	const [columnOrder, setColumnOrder] = useState<string[]>(() => {
		const defaultOrder = columnsWithDetail.map((c) => c.id as string);

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

	// Initialize column visibility from saved state
	const [columnVisibility, setColumnVisibility] = useState<
		Record<string, boolean>
	>(() => {
		if (props.saveState && columnVisibilityToggle) {
			try {
				const savedState = loadTableState(props.saveState);
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
		if (props.saveState && groupable) {
			try {
				const savedState = loadTableState(props.saveState);
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
		if (props.saveState && groupable) {
			try {
				const savedState = loadTableState(props.saveState);
				if (savedState?.expandedGroups) {
					return savedState.expandedGroups;
				}
			} catch (error) {
				console.error("Error loading expanded groups:", error);
			}
		}
		return {};
	});

	// Save state whenever columnOrder, columnSizing, columnVisibility, grouping, or pagination changes
	useEffect(() => {
		if (props.saveState) {
			const state: TableState = {};
			if (props.columnOrderable) {
				state.columnOrder = columnOrder;
			}
			if (props.columnResizable) {
				state.columnSizing = columnSizing;
			}
			if (columnVisibilityToggle) {
				state.columnVisibility = columnVisibility;
			}
			if (groupable) {
				state.groupBy = groupBy;
				state.expandedGroups = expandedGroups;
			}
			if (pagination) {
				state.perPage = perPage;
			}
			saveTableState(props.saveState, state);
		}
	}, [
		columnOrder,
		columnSizing,
		columnVisibility,
		groupBy,
		expandedGroups,
		perPage,
		props.saveState,
		props.columnOrderable,
		props.columnResizable,
		columnVisibilityToggle,
		groupable,
		pagination,
	]);

	// Group data if groupBy is set
	const groupedData = useMemo(() => {
		if (!groupBy) return null;

		const groups = new Map<string, T[]>();

		for (const item of props.data) {
			const groupValue = String(
				(item as Record<string, unknown>)[groupBy] ?? "",
			);
			if (!groups.has(groupValue)) {
				groups.set(groupValue, []);
			}
			groups.get(groupValue)?.push(item);
		}

		return groups;
	}, [props.data, groupBy]);

	// Handle client-side pagination
	const paginatedData = useMemo(() => {
		if (!pagination || paginationType === "server") {
			return props.data;
		}

		const startIndex = (currentPage - 1) * perPage;
		const endIndex = startIndex + perPage;
		return props.data.slice(startIndex, endIndex);
	}, [props.data, pagination, paginationType, currentPage, perPage]);

	// Calculate max page for client-side pagination
	const calculatedMaxPage = useMemo(() => {
		if (!pagination) return 1;
		if (paginationType === "server") {
			return props.maxPage ?? 1;
		}
		return Math.ceil(props.data.length / perPage);
	}, [pagination, paginationType, props.maxPage, props.data.length, perPage]);

	// Handle pagination change
	const handlePaginationChange = (
		newPerPage: number,
		newCurrentPage: number,
	) => {
		if (paginationType === "server" && props.onPaginationChange) {
			props.onPaginationChange(newPerPage, newCurrentPage);
		} else {
			setInternalCurrentPage(newCurrentPage);
		}
		setPerPage(newPerPage);
	};

	// Handle page navigation
	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > calculatedMaxPage) return;

		if (paginationType === "server" && props.onPaginationChange) {
			props.onPaginationChange(perPage, newPage);
		} else {
			setInternalCurrentPage(newPage);
		}
	};

	// Determine if we should show pagination
	// Hide pagination when: grouped (client-side only) or loading
	const shouldShowPagination = useMemo(() => {
		if (!pagination) return false;
		if (loading) return false;
		// For client-side pagination, hide when grouped
		if (paginationType === "client" && groupBy) return false;
		return true;
	}, [pagination, loading, paginationType, groupBy]);

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
		state: {
			columnOrder: props.columnOrderable ? columnOrder : undefined,
			...(props.columnResizable && { columnSizing }),
			...(columnVisibilityToggle && { columnVisibility }),
			...(rowSelectable && { rowSelection }),
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

	// Toggle group expansion
	const toggleGroup = (groupValue: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupValue]: !prev[groupValue],
		}));
	};

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

	// Render pagination controls
	const renderPagination = () => {
		if (!shouldShowPagination) return null;

		const startRecord = (currentPage - 1) * perPage + 1;
		const endRecord = Math.min(
			currentPage * perPage,
			paginationType === "server"
				? (props.recordsTotal ?? 0)
				: props.data.length,
		);
		const totalRecords =
			paginationType === "server"
				? props.recordsTotal
				: props.data.length;

		return (
			<div className="flex items-center justify-between mt-4 px-2">
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">
						Rows per page:
					</span>
					<Select
						value={String(perPage)}
						onChange={(value) => {
							const newPerPage = Number.parseInt(value, 10);
							handlePaginationChange(newPerPage, 1);
						}}
						options={[
							{ value: "10", label: "10" },
							{ value: "20", label: "20" },
							{ value: "50", label: "50" },
							{ value: "100", label: "100" },
						]}
						classNames={{
							root: "w-[70px]",
							trigger: "h-8",
						}}
					/>
					{props.recordsTotal !== undefined && (
						<span className="text-sm text-muted-foreground ml-4">
							{startRecord}-{endRecord} of {totalRecords} records
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => handlePageChange(1)}
						disabled={currentPage === 1 || loading}
					>
						<ChevronLeft className="h-4 w-4" />
						<ChevronLeft className="h-4 w-4 -ml-3" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1 || loading}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm px-4">
						Page {currentPage} of {calculatedMaxPage}
					</span>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage >= calculatedMaxPage || loading}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => handlePageChange(calculatedMaxPage)}
						disabled={currentPage >= calculatedMaxPage || loading}
					>
						<ChevronRight className="h-4 w-4" />
						<ChevronRight className="h-4 w-4 -ml-3" />
					</Button>
				</div>
			</div>
		);
	};

	// Render header section
	const renderHeader = () => {
		if (!showHeader) return null;

		const selectedRowsCount = rowSelectable
			? Object.keys(rowSelection).length
			: 0;
		const selectedRows = rowSelectable
			? table.getSelectedRowModel().rows.map((row) => row.original)
			: [];

		return (
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					{props.title && (
						<h2 className="text-lg font-semibold">{props.title}</h2>
					)}
					{rowSelectable && selectedRowsCount > 0 && (
						<>
							<Badge variant="secondary">
								{selectedRowsCount} selected
							</Badge>
							{props.selectActions?.map((action) => (
								<button
									key={action.name}
									type="button"
									onClick={() => {
										if (props.onSelectAction) {
											props.onSelectAction(
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
				<div className="flex items-center gap-2">
					{columnVisibilityToggle && (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-1" align="end">
								<div className="space-y-0.5">
									<Popover>
										<PopoverTrigger asChild>
											<button
												type="button"
												className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
											>
												<span>Column Visibility</span>
												<ChevronRight className="h-4 w-4 text-muted-foreground" />
											</button>
										</PopoverTrigger>
										<PopoverContent
											className="w-64"
											align="start"
											side="right"
											sideOffset={4}
										>
											<div className="space-y-4">
												<div>
													<h4 className="font-medium mb-3">
														Property visibility
													</h4>
													<div className="relative mb-3">
														<Input
															placeholder="Search for a property..."
															className="h-9"
														/>
													</div>
												</div>
												<Separator />
												<div>
													<p className="text-sm text-muted-foreground mb-2">
														Shown in table
													</p>
													<ScrollArea className="h-48">
														<div className="space-y-1">
															{table
																.getAllLeafColumns()
																.filter(
																	(
																		column,
																	) => {
																		const columnDef =
																			column.columnDef as AdaptiveColumnDef<T>;
																		const hasVisibilityToggle =
																			columnDef.visibilityToggle ??
																			columnVisibilityToggle;
																		return (
																			column.getIsVisible() &&
																			column.id !==
																				"_actions" &&
																			hasVisibilityToggle !==
																				false
																		);
																	},
																)
																.map(
																	(
																		column,
																	) => (
																		<div
																			key={
																				column.id
																			}
																			className="flex items-center"
																		>
																			<button
																				type="button"
																				className="flex items-center gap-2 w-full text-left hover:bg-accent px-2 py-1 rounded-sm"
																			>
																				<Checkbox
																					checked={column.getIsVisible()}
																					onCheckedChange={(
																						value,
																					) =>
																						column.toggleVisibility(
																							!!value,
																						)
																					}
																				/>
																				<Label className="text-sm font-normal cursor-pointer flex-1">
																					{typeof column
																						.columnDef
																						.header ===
																					"string"
																						? column
																								.columnDef
																								.header
																						: column.id}
																				</Label>
																			</button>
																		</div>
																	),
																)}
														</div>
													</ScrollArea>
												</div>
												{table
													.getAllLeafColumns()
													.some((column) => {
														const columnDef =
															column.columnDef as AdaptiveColumnDef<T>;
														const hasVisibilityToggle =
															columnDef.visibilityToggle ??
															columnVisibilityToggle;
														return (
															!column.getIsVisible() &&
															column.id !==
																"_actions" &&
															hasVisibilityToggle !==
																false
														);
													}) && (
													<>
														<Separator />
														<div>
															<p className="text-sm text-muted-foreground mb-2">
																Hidden
															</p>
															<div className="space-y-1">
																{table
																	.getAllLeafColumns()
																	.filter(
																		(
																			column,
																		) => {
																			const columnDef =
																				column.columnDef as AdaptiveColumnDef<T>;
																			const hasVisibilityToggle =
																				columnDef.visibilityToggle ??
																				columnVisibilityToggle;
																			return (
																				!column.getIsVisible() &&
																				column.id !==
																					"_actions" &&
																				hasVisibilityToggle !==
																					false
																			);
																		},
																	)
																	.map(
																		(
																			column,
																		) => (
																			<div
																				key={
																					column.id
																				}
																				className="flex items-center"
																			>
																				<button
																					type="button"
																					className="flex items-center gap-2 w-full text-left hover:bg-accent px-2 py-1 rounded-sm"
																				>
																					<Checkbox
																						checked={column.getIsVisible()}
																						onCheckedChange={(
																							value,
																						) =>
																							column.toggleVisibility(
																								!!value,
																							)
																						}
																					/>
																					<Label className="text-sm font-normal cursor-pointer flex-1">
																						{typeof column
																							.columnDef
																							.header ===
																						"string"
																							? column
																									.columnDef
																									.header
																							: column.id}
																					</Label>
																				</button>
																			</div>
																		),
																	)}
															</div>
														</div>
													</>
												)}
											</div>
										</PopoverContent>
									</Popover>
									{groupable &&
										paginationType !== "server" && (
											<Popover>
												<PopoverTrigger asChild>
													<button
														type="button"
														className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
													>
														<span>Group By</span>
														<ChevronRight className="h-4 w-4 text-muted-foreground" />
													</button>
												</PopoverTrigger>
												<PopoverContent
													className="w-64"
													align="start"
													side="right"
													sideOffset={4}
												>
													<div className="space-y-3">
														<div className="flex items-center justify-between">
															<h4 className="font-medium">
																Group by
																property
															</h4>
															{groupBy && (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		setGroupBy(
																			null,
																		)
																	}
																	className="h-6 px-2"
																>
																	Clear
																</Button>
															)}
														</div>
														<Separator />
														<ScrollArea className="h-48">
															<div className="space-y-1">
																{table
																	.getAllLeafColumns()
																	.filter(
																		(
																			column,
																		) =>
																			column.id !==
																			"_actions",
																	)
																	.map(
																		(
																			column,
																		) => {
																			const isSelected =
																				groupBy ===
																				column.id;
																			return (
																				<button
																					key={
																						column.id
																					}
																					type="button"
																					onClick={() =>
																						setGroupBy(
																							column.id,
																						)
																					}
																					className={`flex items-center gap-2 w-full text-left hover:bg-accent px-2 py-1.5 rounded-sm text-sm transition-colors ${
																						isSelected
																							? "bg-accent"
																							: ""
																					}`}
																				>
																					<div
																						className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
																							isSelected
																								? "bg-primary border-primary"
																								: "border-input"
																						}`}
																					>
																						{isSelected && (
																							<div className="w-2 h-2 bg-primary-foreground rounded-sm" />
																						)}
																					</div>
																					<span>
																						{typeof column
																							.columnDef
																							.header ===
																						"string"
																							? column
																									.columnDef
																									.header
																							: column.id}
																					</span>
																				</button>
																			);
																		},
																	)}
															</div>
														</ScrollArea>
													</div>
												</PopoverContent>
											</Popover>
										)}
									{!groupable && (
										<button
											type="button"
											className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
											onClick={() => {
												// TODO: Implement group by functionality
											}}
										>
											<span>Group By</span>
											<ChevronRight className="h-4 w-4 text-muted-foreground" />
										</button>
									)}
								</div>
							</PopoverContent>
						</Popover>
					)}
					{props.headerActions ? (
						props.headerActions
					) : (
						<Button size="sm">New</Button>
					)}
				</div>
			</div>
		);
	};

	// Render orderable table
	if (props.columnOrderable) {
		return (
			<div>
				{renderHeader()}
				<DndContext
					collisionDetection={closestCenter}
					modifiers={[restrictToHorizontalAxis]}
					onDragEnd={handleDragEnd}
					sensors={sensors}
				>
					<div>
						<table
							className="border-collapse"
							style={columnSizeVars}
						>
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										<SortableContext
											items={columnOrder}
											strategy={
												horizontalListSortingStrategy
											}
										>
											{headerGroup.headers.map(
												(header) => (
													<DraggableTableHeader
														key={header.id}
														header={header}
														columnResizable={
															props.columnResizable
														}
														columnVisibilityToggle={
															columnVisibilityToggle
														}
														table={table}
														groupable={groupable}
														groupBy={groupBy}
														onGroupByChange={
															setGroupBy
														}
														paginationType={
															paginationType
														}
													/>
												),
											)}
										</SortableContext>
									</tr>
								))}
							</thead>
							<tbody>
								{loading
									? // Render skeleton loader
										renderSkeletonRows(
											table.getHeaderGroups()[0]?.headers
												.length ?? 1,
										)
									: groupedData && groupBy
										? // Render grouped rows
											Array.from(
												groupedData.entries(),
											).map(
												([groupValue, groupItems]) => {
													const isExpanded =
														expandedGroups[
															groupValue
														] ?? true;
													const columnCount =
														table.getHeaderGroups()[0]
															?.headers.length ??
														1;

													return (
														<>
															<tr
																key={`group-${groupValue}`}
																className="bg-muted/50 hover:bg-muted/70 transition-colors"
															>
																<td
																	colSpan={
																		columnCount
																	}
																	className="border px-3 py-2"
																>
																	<button
																		type="button"
																		onClick={() =>
																			toggleGroup(
																				groupValue,
																			)
																		}
																		className="flex items-center gap-2 w-full text-left font-medium"
																	>
																		<ChevronRight
																			className={`h-4 w-4 transition-transform ${
																				isExpanded
																					? "rotate-90"
																					: ""
																			}`}
																		/>
																		<span>
																			{
																				groupValue
																			}{" "}
																			(
																			{
																				groupItems.length
																			}
																			)
																		</span>
																	</button>
																</td>
															</tr>
															{isExpanded &&
																groupItems.map(
																	(item) => {
																		// Find the original index in props.data
																		const originalIndex =
																			props.data.indexOf(
																				item,
																			);
																		// Create a temporary row for this item
																		const rows =
																			table.getRowModel()
																				.rows;
																		const row =
																			rows[
																				originalIndex
																			];
																		if (
																			!row
																		)
																			return null;

																		return (
																			<tr
																				key={
																					row.id
																				}
																			>
																				{row
																					.getVisibleCells()
																					.map(
																						(
																							cell,
																						) => (
																							<SortableContext
																								key={
																									cell.id
																								}
																								items={
																									columnOrder
																								}
																								strategy={
																									horizontalListSortingStrategy
																								}
																							>
																								<DragAlongCell
																									key={
																										cell.id
																									}
																									cell={
																										cell
																									}
																									columnResizable={
																										props.columnResizable
																									}
																									rowIndex={
																										originalIndex
																									}
																								/>
																							</SortableContext>
																						),
																					)}
																			</tr>
																		);
																	},
																)}
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
															.map((cell) => (
																<SortableContext
																	key={
																		cell.id
																	}
																	items={
																		columnOrder
																	}
																	strategy={
																		horizontalListSortingStrategy
																	}
																>
																	<DragAlongCell
																		key={
																			cell.id
																		}
																		cell={
																			cell
																		}
																		columnResizable={
																			props.columnResizable
																		}
																		rowIndex={
																			rowIndex
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

				{/* Pagination */}
				{renderPagination()}

				{/* Detail Sheet */}
				{showDetail && !props.onDetailClick && (
					<Sheet
						open={detailRowIndex !== null}
						onOpenChange={(open) => {
							if (!open) setDetailRowIndex(null);
						}}
					>
						<SheetContent
							side="right"
							className="w-[400px] sm:w-[540px] p-4"
						>
							<SheetHeader className="mb-4">
								<SheetTitle>Row Details</SheetTitle>
							</SheetHeader>
							<div>
								{detailRowIndex !== null && (
									<table className="w-full">
										<tbody>
											{columnsWithIds.map((column) => {
												const columnId =
													column.id as string;
												const row =
													props.data[detailRowIndex];
												if (!row) return null;

												// Get the value using accessorKey if available
												let value: unknown;
												if (
													"accessorKey" in column &&
													column.accessorKey
												) {
													value = (
														row as Record<
															string,
															unknown
														>
													)[
														column.accessorKey as string
													];
												} else if (
													"accessorFn" in column &&
													column.accessorFn
												) {
													value = column.accessorFn(
														row,
														detailRowIndex,
													);
												} else {
													value = (
														row as Record<
															string,
															unknown
														>
													)[columnId];
												}

												const header =
													typeof column.header ===
													"string"
														? column.header
														: columnId;

												return (
													<tr
														key={columnId}
														className="border-b last:border-b-0"
													>
														<td className="py-2 px-2 font-medium text-sm text-muted-foreground w-1/3">
															{header}
														</td>
														<td className="py-2 px-2 text-sm">
															<DetailCell
																column={column}
																value={value}
																rowIndex={
																	detailRowIndex
																}
																row={row}
															/>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								)}
							</div>
						</SheetContent>
					</Sheet>
				)}
			</div>
		);
	}

	// Render regular table
	return (
		<div>
			{renderHeader()}
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
										{columnVisibilityToggle && (
											<ContextMenuItem
												onSelect={() =>
													header.column.toggleVisibility(
														false,
													)
												}
											>
												Hide column
											</ContextMenuItem>
										)}
										{groupable &&
											paginationType !== "server" &&
											header.column.id !== "_actions" && (
												<>
													{columnVisibilityToggle && (
														<Separator />
													)}
													<ContextMenuItem
														onSelect={() => {
															setGroupBy(
																groupBy ===
																	header
																		.column
																		.id
																	? null
																	: header
																			.column
																			.id,
															);
														}}
													>
														{groupBy ===
														header.column.id
															? "Ungroup"
															: "Group by this column"}
													</ContextMenuItem>
												</>
											)}
										{!columnVisibilityToggle &&
											!groupable && (
												<ContextMenuItem>
													Dummy Menu Item
												</ContextMenuItem>
											)}
									</ContextMenuContent>
								</ContextMenu>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{loading
						? // Render skeleton loader
							renderSkeletonRows(
								table.getHeaderGroups()[0]?.headers.length ?? 1,
							)
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
															className="flex items-center gap-2 w-full text-left font-medium"
														>
															<ChevronRight
																className={`h-4 w-4 transition-transform ${
																	isExpanded
																		? "rotate-90"
																		: ""
																}`}
															/>
															<span>
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
																		) => (
																			<td
																				key={
																					cell.id
																				}
																				className="border"
																				style={{
																					width: props.columnResizable
																						? `calc(var(--col-${cell.column.id}-size) * 1px)`
																						: undefined,
																				}}
																			>
																				<EditableCell
																					cell={
																						cell
																					}
																					rowIndex={
																						originalIndex
																					}
																				/>
																			</td>
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
												.map((cell) => (
													<td
														key={cell.id}
														className="border"
														style={{
															width: props.columnResizable
																? `calc(var(--col-${cell.column.id}-size) * 1px)`
																: undefined,
														}}
													>
														<EditableCell
															cell={cell}
															rowIndex={rowIndex}
														/>
													</td>
												))}
										</tr>
									))}
				</tbody>
			</table>

			{/* Pagination */}
			{renderPagination()}

			{/* Detail Sheet */}
			{showDetail && !props.onDetailClick && (
				<Sheet
					open={detailRowIndex !== null}
					onOpenChange={(open) => {
						if (!open) setDetailRowIndex(null);
					}}
				>
					<SheetContent
						side="right"
						className="w-[400px] sm:w-[540px] p-4"
					>
						<SheetHeader className="mb-4">
							<SheetTitle>Row Details</SheetTitle>
						</SheetHeader>
						<div>
							{detailRowIndex !== null && (
								<table className="w-full">
									<tbody>
										{columnsWithIds.map((column) => {
											const columnId =
												column.id as string;
											const row =
												props.data[detailRowIndex];
											if (!row) return null;

											// Get the value using accessorKey if available
											let value: unknown;
											if (
												"accessorKey" in column &&
												column.accessorKey
											) {
												value = (
													row as Record<
														string,
														unknown
													>
												)[column.accessorKey as string];
											} else if (
												"accessorFn" in column &&
												column.accessorFn
											) {
												value = column.accessorFn(
													row,
													detailRowIndex,
												);
											} else {
												value = (
													row as Record<
														string,
														unknown
													>
												)[columnId];
											}

											const header =
												typeof column.header ===
												"string"
													? column.header
													: columnId;

											return (
												<tr
													key={columnId}
													className="border-b last:border-b-0"
												>
													<td className="py-2 px-2 font-medium text-sm text-muted-foreground w-1/3">
														{header}
													</td>
													<td className="py-2 px-2 text-sm">
														<DetailCell
															column={column}
															value={value}
															rowIndex={
																detailRowIndex
															}
															row={row}
														/>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							)}
						</div>
					</SheetContent>
				</Sheet>
			)}
		</div>
	);
}

export default AdaptiveTable;
