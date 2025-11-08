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
	Separator,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@repo/ui";
import {
	type Cell,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type Header,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
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
	groupable?: boolean; // Default: false - to be implemented
	saveState?: string; // Unique key to save/load table state
	// Header section props
	title?: string;
	headerActions?: ReactNode;
	showHeader?: boolean; // Default: true
	// Detail view props
	showDetail?: boolean; // Default: true
	onDetailClick?: (row: T, rowIndex: number) => void;
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
}: {
	header: Header<T, unknown>;
	columnResizable?: boolean;
	columnVisibilityToggle?: boolean;
	table: ReturnType<typeof useReactTable<T>>;
}) => {
	const columnDef = header.column.columnDef as AdaptiveColumnDef<T>;
	const isDetailColumn = header.column.id === "_detail";

	// Check column-level overrides
	const isOrderable = columnDef.orderable ?? true; // Default to true if not specified
	const isResizable =
		(columnDef.resizable ?? columnResizable) && !isDetailColumn;
	const hasVisibilityToggle =
		(columnDef.visibilityToggle ?? columnVisibilityToggle) &&
		!isDetailColumn;

	const { attributes, isDragging, listeners, setNodeRef, transform } =
		useSortable({
			id: header.column.id,
			disabled: isDetailColumn || !isOrderable,
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
						{!isDetailColumn && isOrderable && (
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
	const isDetailColumn = cell.column.id === "_detail";

	// Check column-level override for orderable
	const isOrderable = columnDef.orderable ?? true; // Default to true if not specified

	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
		disabled: isDetailColumn || !isOrderable,
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

	// State for detail view
	const [detailRowIndex, setDetailRowIndex] = useState<number | null>(null);

	// Ensure all columns have IDs
	const columnsWithIds = useMemo(
		() => ensureColumnIds(props.columns),
		[props.columns],
	);

	// Add detail column if showDetail is enabled
	const columnsWithDetail = useMemo(() => {
		if (!showDetail) return columnsWithIds;

		const detailColumn: AdaptiveColumnDef<T> = {
			id: "_detail",
			header: "",
			cell: ({ row }) => (
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
					className="p-2 hover:bg-accent rounded transition-colors"
					aria-label="Show details"
				>
					<ChevronRight className="h-4 w-4 text-gray-500" />
				</button>
			),
			size: 50,
			enableResizing: false,
			enableHiding: false,
			enableSorting: false,
			// Column-level overrides
			orderable: false,
			resizable: false,
			visibilityToggle: false,
		};

		return [detailColumn, ...columnsWithIds];
	}, [showDetail, columnsWithIds, props]);

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

	// Save state whenever columnOrder, columnSizing, or columnVisibility changes
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
			saveTableState(props.saveState, state);
		}
	}, [
		columnOrder,
		columnSizing,
		columnVisibility,
		props.saveState,
		props.columnOrderable,
		props.columnResizable,
		columnVisibilityToggle,
	]);

	const table = useReactTable({
		data: props.data,
		columns: columnsWithDetail,
		getCoreRowModel: getCoreRowModel(),
		state: {
			columnOrder: props.columnOrderable ? columnOrder : undefined,
			...(props.columnResizable && { columnSizing }),
			...(columnVisibilityToggle && { columnVisibility }),
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

	// Render header section
	const renderHeader = () => {
		if (!showHeader) return null;

		return (
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					{props.title && (
						<h2 className="text-lg font-semibold">{props.title}</h2>
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
																				"_detail" &&
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
																"_detail" &&
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
																					"_detail" &&
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
													/>
												),
											)}
										</SortableContext>
									</tr>
								))}
							</thead>
							<tbody>
								{table
									.getRowModel()
									.rows.map((row, rowIndex) => (
										<tr key={row.id}>
											{row
												.getVisibleCells()
												.map((cell) => (
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
															rowIndex={rowIndex}
														/>
													</SortableContext>
												))}
										</tr>
									))}
							</tbody>
						</table>
					</div>
				</DndContext>

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
										{!columnVisibilityToggle && (
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
					{table.getRowModel().rows.map((row, rowIndex) => (
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
