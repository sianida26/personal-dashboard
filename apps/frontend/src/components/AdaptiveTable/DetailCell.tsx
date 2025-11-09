import { Badge, Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { AdaptiveColumnDef } from "./types";

export const DetailCell = <T,>({
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

export default DetailCell;
