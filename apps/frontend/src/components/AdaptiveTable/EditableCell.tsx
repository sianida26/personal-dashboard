import { Badge, Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import { type Cell, flexRender } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { AdaptiveColumnDef } from "./types";

export const EditableCell = <T,>({
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
		return (
			<div className="text-sm py-1">
				{flexRender(columnDef.cell, cell.getContext())}
			</div>
		);
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
						className="cursor-pointer hover:bg-accent/50 py-1 flex items-center justify-between w-full text-left group"
					>
						<Badge
							variant="secondary"
							className={`text-sm flex justify-between item-start gap-2 w-full ${columnDef.cellClassName || ""}`}
							style={
								cellColor
									? {
											backgroundColor: cellColor,
											color: "white",
										}
									: undefined
							}
						>
							<span className="clamp-1">{displayValue}</span>
							<ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
						</Badge>
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
										className="text-sm"
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
				className="w-full bg-transparent py-1 text-sm outline-none focus:outline-none focus:ring-0 leading-normal"
			/>
		);
	}

	// Text type shows plain value, not a chip
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Editable cell needs onClick for editing
		// biome-ignore lint/a11y/useKeyWithClickEvents: Editable cell needs onClick for editing
		<div
			onClick={() => setIsEditing(true)}
			className="cursor-text py-1 w-full text-sm leading-normal"
		>
			{displayValue}
		</div>
	);
};

export default EditableCell;
