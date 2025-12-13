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
				className="w-full px-2 py-1 outline outline-2 outline-blue-500 bg-transparent focus:outline-none"
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

export default EditableCell;
