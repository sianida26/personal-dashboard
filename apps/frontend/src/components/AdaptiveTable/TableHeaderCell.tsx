import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	Separator,
} from "@repo/ui";
import {
	flexRender,
	type Header,
	type useReactTable,
} from "@tanstack/react-table";
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
	table,
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
	table: ReturnType<typeof useReactTable<T>>;
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

	// Build style based on whether draggable or not
	const style: CSSProperties =
		draggable && sortableHook
			? {
					opacity: sortableHook.isDragging ? 0.8 : 1,
					position: "relative",
					transform: CSS.Translate.toString(sortableHook.transform),
					transition: "width transform 0.2s ease-in-out",
					whiteSpace: "nowrap",
					width:
						proportionalWidth ??
						(virtualized
							? header.getSize()
							: columnResizable
								? `calc(var(--header-${header.id}-size) * 1px)`
								: header.column.getSize()),
					zIndex: sortableHook.isDragging ? 1 : 0,
					...(virtualized ? { display: "flex" } : {}),
					...(fitToParentWidth
						? { overflow: "hidden", textOverflow: "ellipsis" }
						: {}),
				}
			: {
					width:
						proportionalWidth ??
						(virtualized
							? header.getSize()
							: columnResizable
								? `calc(var(--header-${header.id}-size) * 1px)`
								: undefined),
					...(virtualized ? { display: "flex" } : {}),
					...(fitToParentWidth
						? { overflow: "hidden", textOverflow: "ellipsis" }
						: {}),
				};

	return (
		<th
			colSpan={header.colSpan}
			ref={sortableHook?.setNodeRef}
			style={style}
			className={`border-y border-l relative p-1 ${
				isResizable ? "" : "border-r"
			} ${
				draggable && !isActionsColumn && isOrderable
					? "cursor-grab active:cursor-grabbing"
					: ""
			}`}
			{...(draggable && !isActionsColumn && isOrderable && sortableHook
				? {
						...sortableHook.attributes,
						...sortableHook.listeners,
					}
				: {})}
		>
			<ContextMenu>
				<ContextMenuTrigger asChild>
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
				</ContextMenuTrigger>
				<ContextMenuContent>
					{hasVisibilityToggle && (
						<ContextMenuItem
							className="text-sm"
							onSelect={() =>
								header.column.toggleVisibility(false)
							}
						>
							Hide column
						</ContextMenuItem>
					)}
					{isSortable && (
						<>
							{hasVisibilityToggle && <Separator />}
							<ContextMenuItem
								className="text-sm"
								onSelect={() =>
									header.column.toggleSorting(false)
								}
							>
								Sort Ascending
							</ContextMenuItem>
							<ContextMenuItem
								className="text-sm"
								onSelect={() =>
									header.column.toggleSorting(true)
								}
							>
								Sort Descending
							</ContextMenuItem>
							{sortedState && (
								<ContextMenuItem
									onSelect={() =>
										header.column.clearSorting()
									}
								>
									Clear Sort
								</ContextMenuItem>
							)}
						</>
					)}
					{canGroup && !isActionsColumn && (
						<>
							{(hasVisibilityToggle || isSortable) && (
								<Separator />
							)}
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
					{!columnVisibilityToggle && !canGroup && !isSortable && (
						<ContextMenuItem className="text-sm">
							Dummy Menu Item
						</ContextMenuItem>
					)}
				</ContextMenuContent>
			</ContextMenu>
			{isResizable && (
				<button
					type="button"
					onDoubleClick={() => header.column.resetSize()}
					onMouseDown={header.getResizeHandler()}
					onTouchStart={header.getResizeHandler()}
					className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none border-r border-border hover:border-primary hover:border-r-2 bg-transparent p-0 ${
						header.column.getIsResizing()
							? "border-primary border-r-2"
							: ""
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
				/>
			)}
		</th>
	);
};

export default TableHeaderCell;
