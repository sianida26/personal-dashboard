import { Badge, Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import { type Cell, flexRender } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { memo, useEffect, useState } from "react";
import type { AdaptiveColumnDef } from "./types";

const EditableCellComponent = <T,>({
	cell,
	rowIndex,
	isRowSelected: _isRowSelected, // Used to trigger re-render on selection change
}: {
	cell: Cell<T, unknown>;
	rowIndex: number;
	isRowSelected?: boolean;
}) => {
	const columnDef = cell.column.columnDef as AdaptiveColumnDef<T>;
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(cell.getValue());
	const [searchQuery, setSearchQuery] = useState("");

	// Get the current cell value directly (not from state)
	const currentValue = cell.getValue();

	// Sync edit value when cell value changes (e.g., from filtering)
	useEffect(() => {
		setEditValue(currentValue);
	}, [currentValue]);

	// Reset search query when popover closes
	useEffect(() => {
		if (!isEditing) {
			setSearchQuery("");
		}
	}, [isEditing]);

	const handleSave = () => {
		if (columnDef.onEdited) {
			columnDef.onEdited(
				rowIndex,
				cell.column.id,
				editValue,
				cell.row.original,
			);
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setEditValue(currentValue);
			setIsEditing(false);
		}
	};

	const handleSelectOption = (optionValue: string | number) => {
		setEditValue(optionValue);
		if (columnDef.onEdited) {
			columnDef.onEdited(
				rowIndex,
				cell.column.id,
				optionValue,
				cell.row.original,
			);
		}
		setIsEditing(false);
	};

	// Helper to get color for current value (use currentValue, not state)
	const getColorForValue = () => {
		if (columnDef.getCellColor) {
			return columnDef.getCellColor(currentValue);
		}
		if (columnDef.options) {
			const option = columnDef.options.find(
				(opt) => String(opt.value) === String(currentValue),
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

	// Render as chip/badge for editable cells - use currentValue for display
	const cellColor = getColorForValue();
	const displayValue =
		columnDef.options?.find(
			(opt) => String(opt.value) === String(currentValue),
		)?.label || String(currentValue ?? "");

	// For select type, use Popover with menu
	if (columnDef.editType === "select") {
		// If there's a custom cell renderer, use it for display when not editing
		const hasCustomCell =
			columnDef.cell && typeof columnDef.cell === "function";

		return (
			<Popover open={isEditing} onOpenChange={setIsEditing}>
				<PopoverTrigger asChild>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsEditing(true);
						}}
						className="cursor-pointer hover:bg-accent/50 py-1 flex items-center justify-between w-full text-left group"
					>
						{hasCustomCell ? (
							<div className="w-full">
								{flexRender(columnDef.cell, cell.getContext())}
							</div>
						) : (
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
						)}
					</button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto min-w-[200px] p-2"
					align="start"
				>
					<div className="flex flex-col gap-2">
						{/* Search input */}
						{columnDef.options && columnDef.options.length > 5 && (
							<input
								type="text"
								placeholder="Cari..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onClick={(e) => e.stopPropagation()}
								className="w-full px-2 py-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-primary"
							/>
						)}

						{/* Scrollable options container */}
						<div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
							{columnDef.options
								?.filter((option) =>
									searchQuery
										? option.label
												.toLowerCase()
												.includes(
													searchQuery.toLowerCase(),
												)
										: true,
								)
								.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() =>
											handleSelectOption(option.value)
										}
										className="text-left px-2 py-1 hover:bg-accent rounded-sm text-sm transition-colors"
									>
										{columnDef.customOptionComponent ? (
											columnDef.customOptionComponent(
												option,
											)
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
							{columnDef.options?.filter((option) =>
								searchQuery
									? option.label
											.toLowerCase()
											.includes(searchQuery.toLowerCase())
									: true,
							).length === 0 && (
								<div className="text-sm text-gray-500 text-center py-2">
									Tidak ada hasil
								</div>
							)}
						</div>
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
				onClick={(e) => e.stopPropagation()}
				// biome-ignore lint/a11y/noAutofocus: Editable cell needs autoFocus for better UX when entering edit mode
				autoFocus
				className="w-full bg-transparent py-1 text-sm outline-none focus:outline-none focus:ring-0 leading-normal"
			/>
		);
	}

	// Text type shows plain value, not a chip
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Editable cell needs onClick for editing
		// biome-ignore lint/a11y/useKeyWithClickEvents: Editable cell needs onClick for editing
		<div
			onClick={(e) => {
				e.stopPropagation();
				setIsEditing(true);
			}}
			className="cursor-text py-1 w-full text-sm leading-normal"
		>
			{displayValue}
		</div>
	);
};

// Memo wrapper to prevent unnecessary re-renders
export const EditableCell = Object.assign(
	memo(EditableCellComponent) as typeof EditableCellComponent,
	{ displayName: "EditableCell" },
);

export default EditableCell;
