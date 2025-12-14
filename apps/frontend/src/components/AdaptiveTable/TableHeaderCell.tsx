import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@repo/ui";
import { flexRender, type Header } from "@tanstack/react-table";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Columns3,
	EyeOff,
	Group,
	Ungroup,
	X,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { AdaptiveColumnDef } from "./types";

/**
 * Unified table header cell component
 * Supports both draggable (orderable) and static headers
 */
export const TableHeaderCell = <T,>({
	header,
	draggable = false,
	columnResizable,
	columnVisibilityToggle,
	groupable,
	groupBy,
	onGroupByChange,
	paginationType,
	sortable,
	virtualized = false,
	fitToParentWidth = false,
	proportionalWidth,
}: {
	header: Header<T, unknown>;
	draggable?: boolean;
	columnResizable?: boolean;
	columnVisibilityToggle?: boolean;
	groupable?: boolean;
	groupBy?: string | null;
	onGroupByChange?: (columnId: string | null) => void;
	paginationType?: "client" | "server";
	sortable?: boolean;
	virtualized?: boolean;
	fitToParentWidth?: boolean;
	proportionalWidth?: string | number;
}) => {
	const columnDef = header.column.columnDef as AdaptiveColumnDef<T>;
	const isActionsColumn = header.column.id === "_actions";

	// Disable grouping for server-side pagination
	const canGroup = groupable && paginationType !== "server";

	// Check column-level overrides
	const isOrderable = columnDef.orderable ?? true;
	const isResizable =
		(columnDef.resizable ?? columnResizable) && !isActionsColumn;
	const hasVisibilityToggle =
		(columnDef.visibilityToggle ?? columnVisibilityToggle) &&
		!isActionsColumn;
	const isSortable = (columnDef.sortable ?? sortable) && !isActionsColumn;

	// Only use sortable hook if draggable is enabled
	const sortableHook = draggable
		? // eslint-disable-next-line react-hooks/rules-of-hooks
			useSortable({
				id: header.column.id,
				disabled: isActionsColumn || !isOrderable,
			})
		: null;

	const sortedState = header.column.getIsSorted();
	const isResizing = header.column.getIsResizing();

	// Get the current width - use direct size for immediate resize feedback
	const currentWidth = proportionalWidth ?? header.getSize();

	// Build style based on whether draggable or not
	const style: CSSProperties =
		draggable && sortableHook
			? {
					opacity: sortableHook.isDragging ? 0.8 : 1,
					position: "relative",
					// Don't apply transform during resize to keep resize handle anchored
					transform: isResizing
						? undefined
						: CSS.Translate.toString(sortableHook.transform),
					// Disable transition during resize for immediate feedback
					transition: isResizing
						? "none"
						: "transform 0.2s ease-in-out",
					whiteSpace: "nowrap",
					width: currentWidth,
					minWidth: header.column.columnDef.minSize ?? 80,
					zIndex: sortableHook.isDragging ? 1 : 0,
					...(virtualized
						? { display: "flex", alignItems: "center" }
						: {}),
					...(fitToParentWidth
						? { overflow: "hidden", textOverflow: "ellipsis" }
						: {}),
				}
			: {
					width: currentWidth,
					minWidth: header.column.columnDef.minSize ?? 80,
					...(virtualized
						? { display: "flex", alignItems: "center" }
						: {}),
					...(fitToParentWidth
						? { overflow: "hidden", textOverflow: "ellipsis" }
						: {}),
				};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<th
					colSpan={header.colSpan}
					ref={sortableHook?.setNodeRef}
					style={style}
					className={`border-b relative p-1 hover:bg-muted/50 transition-colors ${draggable && !isActionsColumn && isOrderable && !isResizing ? "cursor-grab active:cursor-grabbing" : ""}`}
					{...(draggable &&
					!isActionsColumn &&
					isOrderable &&
					sortableHook &&
					!isResizing
						? {
								...sortableHook.attributes,
								...sortableHook.listeners,
							}
						: {})}
				>
					<div className="flex items-center text-sm font-semibold leading-normal">
						{header.isPlaceholder
							? null
							: flexRender(
									header.column.columnDef.header,
									header.getContext(),
								)}
						{isSortable && sortedState && (
							<span className="ml-1 text-sm">
								{sortedState === "asc" ? "🔼" : "🔽"}
							</span>
						)}
					</div>
					{isResizable && (
						<button
							type="button"
							onDoubleClick={() => header.column.resetSize()}
							onMouseDown={(e) => {
								e.stopPropagation();
								header.getResizeHandler()(e);
							}}
							onTouchStart={(e) => {
								e.stopPropagation();
								header.getResizeHandler()(e);
							}}
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
							className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-primary/50 border-0 p-0 ${header.column.getIsResizing() ? "bg-primary/50" : "bg-transparent"}`}
							style={{
								userSelect: "none",
							}}
							aria-label="Resize column"
						/>
					)}
				</th>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				{hasVisibilityToggle && (
					<ContextMenuItem
						className="text-sm gap-2"
						onSelect={() => header.column.toggleVisibility(false)}
					>
						<EyeOff className="h-4 w-4" />
						Hide column
					</ContextMenuItem>
				)}
				{isSortable && (
					<>
						{hasVisibilityToggle && <ContextMenuSeparator />}
						<ContextMenuSub>
							<ContextMenuSubTrigger className="text-sm gap-2">
								<Columns3 className="h-4 w-4" />
								Sort
							</ContextMenuSubTrigger>
							<ContextMenuSubContent className="w-40">
								<ContextMenuItem
									className="text-sm gap-2"
									onSelect={() =>
										header.column.toggleSorting(false)
									}
								>
									<ArrowUpAZ className="h-4 w-4" />
									Ascending
								</ContextMenuItem>
								<ContextMenuItem
									className="text-sm gap-2"
									onSelect={() =>
										header.column.toggleSorting(true)
									}
								>
									<ArrowDownAZ className="h-4 w-4" />
									Descending
								</ContextMenuItem>
								{sortedState && (
									<>
										<ContextMenuSeparator />
										<ContextMenuItem
											className="text-sm gap-2"
											onSelect={() =>
												header.column.clearSorting()
											}
										>
											<X className="h-4 w-4" />
											Clear sort
										</ContextMenuItem>
									</>
								)}
							</ContextMenuSubContent>
						</ContextMenuSub>
					</>
				)}
				{canGroup && !isActionsColumn && (
					<>
						{(hasVisibilityToggle || isSortable) && (
							<ContextMenuSeparator />
						)}
						<ContextMenuItem
							className="text-sm gap-2"
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
							{groupBy === header.column.id ? (
								<>
									<Ungroup className="h-4 w-4" />
									Ungroup
								</>
							) : (
								<>
									<Group className="h-4 w-4" />
									Group by this column
								</>
							)}
						</ContextMenuItem>
					</>
				)}
				{!columnVisibilityToggle && !canGroup && !isSortable && (
					<ContextMenuItem
						className="text-sm text-muted-foreground"
						disabled
					>
						No actions available
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default TableHeaderCell;
