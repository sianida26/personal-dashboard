import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Cell } from "@tanstack/react-table";
import { type CSSProperties, memo } from "react";
import EditableCell from "./EditableCell";
import type { AdaptiveColumnDef } from "./types";

const DragAlongCellComponent = <T,>({
	cell,
	rowIndex,
	proportionalWidth,
	rowHeight = 40,
}: {
	cell: Cell<T, unknown>;
	rowIndex: number;
	proportionalWidth?: string | number;
	rowHeight?: number;
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

// Memo wrapper to prevent unnecessary re-renders
const DragAlongCell = memo(
	DragAlongCellComponent,
) as typeof DragAlongCellComponent;

export default DragAlongCell;
