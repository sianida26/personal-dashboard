import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Cell } from "@tanstack/react-table";
import { type CSSProperties, memo } from "react";
import EditableCell from "./EditableCell";
import type { AdaptiveColumnDef } from "./types";

interface DragAlongCellProps<T> {
	cell: Cell<T, unknown>;
	rowIndex: number;
	proportionalWidth?: string | number;
	rowHeight?: number;
	isRowSelected?: boolean; // Passed from parent to trigger re-render on selection change
}

const DragAlongCellComponent = <T,>({
	cell,
	rowIndex,
	proportionalWidth,
	rowHeight = 40,
}: DragAlongCellProps<T>) => {
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
		transition: "transform 0.2s ease-in-out",
		width: proportionalWidth ?? cell.column.getSize(),
		minWidth: cell.column.columnDef.minSize ?? 80,
		height: rowHeight,
		zIndex: isDragging ? 1 : 0,
		overflow: "hidden",
	};

	return (
		<td style={style} ref={setNodeRef} className="p-1 overflow-hidden">
			<div className="truncate w-full h-full flex items-center">
				<EditableCell cell={cell} rowIndex={rowIndex} />
			</div>
		</td>
	);
};

// Custom comparison function - compare isRowSelected prop directly
const arePropsEqual = <T,>(
	prevProps: DragAlongCellProps<T>,
	nextProps: DragAlongCellProps<T>,
) => {
	// Re-render if row selection state changed (passed as prop from parent)
	if (prevProps.isRowSelected !== nextProps.isRowSelected) {
		return false;
	}
	// Check other props
	return (
		prevProps.cell.id === nextProps.cell.id &&
		prevProps.rowIndex === nextProps.rowIndex &&
		prevProps.proportionalWidth === nextProps.proportionalWidth &&
		prevProps.rowHeight === nextProps.rowHeight &&
		prevProps.cell.column.getSize() === nextProps.cell.column.getSize()
	);
};

// Memo wrapper with custom comparison to handle selection state
const DragAlongCell = memo(
	DragAlongCellComponent,
	arePropsEqual,
) as typeof DragAlongCellComponent;

export default DragAlongCell;
