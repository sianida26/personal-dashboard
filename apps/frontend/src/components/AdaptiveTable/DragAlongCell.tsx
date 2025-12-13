import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Cell } from "@tanstack/react-table";
import type { CSSProperties } from "react";
import EditableCell from "./EditableCell";
import type { AdaptiveColumnDef } from "./types";

const DragAlongCell = <T,>({
	cell,
	columnResizable,
	rowIndex,
	proportionalWidth,
}: {
	cell: Cell<T, unknown>;
	columnResizable?: boolean;
	rowIndex: number;
	proportionalWidth?: string | number;
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
		width:
			proportionalWidth ??
			(columnResizable
				? `calc(var(--col-${cell.column.id}-size) * 1px)`
				: cell.column.getSize()),
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<td style={style} ref={setNodeRef} className="border p-1">
			<EditableCell cell={cell} rowIndex={rowIndex} />
		</td>
	);
};

export default DragAlongCell;
