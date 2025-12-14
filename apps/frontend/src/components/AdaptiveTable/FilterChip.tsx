import {
	Button,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
} from "@repo/ui";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterCondition, FilterOperator } from "./filterEngine";
import {
	operatorLabels,
	operatorRequiresValue,
	operatorsByType,
} from "./filterEngine";
import type { AdaptiveColumnDef, FilterableColumn } from "./types";

interface FilterChipProps<T> {
	filter: FilterCondition;
	table: Table<T>;
	filterableColumns: FilterableColumn[];
	onUpdate: (updates: Partial<FilterCondition>) => void;
	onRemove: () => void;
}

export function FilterChip<T>({
	filter,
	table,
	filterableColumns,
	onUpdate,
	onRemove,
}: FilterChipProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const [localValue, setLocalValue] = useState(
		filter.value?.toString() ?? "",
	);
	const inputRef = useRef<HTMLInputElement>(null);

	// Get column label
	const getColumnLabel = (columnId: string) => {
		const column = table.getColumn(columnId);
		if (!column) return columnId;
		const columnDef = column.columnDef as AdaptiveColumnDef<T>;
		return typeof columnDef.header === "string"
			? columnDef.header
			: columnId;
	};

	// Get select options for the column
	const getSelectOptions = (columnId: string) => {
		const filterCol = filterableColumns.find(
			(f) => f.columnId === columnId,
		);
		return filterCol?.options ?? [];
	};

	// Get operators for current filter type
	const operators = operatorsByType[filter.filterType] as FilterOperator[];
	const requiresValue = operatorRequiresValue(filter.operator);

	// Build column options for select
	const columnOptions = useMemo(
		() =>
			filterableColumns.map((filterCol) => ({
				value: filterCol.columnId,
				label: getColumnLabel(filterCol.columnId),
			})),
		[filterableColumns, table],
	);

	// Build operator options for select
	const operatorOptions = useMemo(
		() =>
			operators.map((op) => ({
				value: op,
				label: operatorLabels[op],
			})),
		[operators],
	);

	// Build value options for select type
	const valueOptions = useMemo(() => {
		if (filter.filterType !== "select") return [];
		return getSelectOptions(filter.columnId).map((option) => ({
			value: String(option.value),
			label: String(option.label),
		}));
	}, [filter.filterType, filter.columnId, filterableColumns]);

	// Sync local value with filter value
	useEffect(() => {
		const newValue = filter.value?.toString() ?? "";
		setLocalValue(newValue);
	}, [filter.value]);

	// Focus input when popover opens
	useEffect(() => {
		if (isOpen && requiresValue && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [isOpen, requiresValue]);

	// Handle local value change (no auto-apply)
	const handleLocalValueChange = (newValue: string) => {
		setLocalValue(newValue);
	};

	// Apply the filter value - read directly from input or state
	const handleApplyFilter = () => {
		// Read directly from input element if available, otherwise use state
		const currentValue = inputRef.current?.value ?? localValue;
		// Convert value based on filter type
		let typedValue: string | number | boolean | null = currentValue;
		if (filter.filterType === "number" && currentValue !== "") {
			typedValue = Number(currentValue);
		}

		onUpdate({ value: typedValue === "" ? undefined : typedValue });
		setIsOpen(false);
	};

	// Handle select value change (auto-apply for select/date types)
	const handleSelectValueChange = (newValue: string) => {
		setLocalValue(newValue);
		// Convert value based on filter type
		let typedValue: string | number | boolean | null = newValue;
		if (filter.filterType === "number" && newValue !== "") {
			typedValue = Number(newValue);
		}
		onUpdate({ value: typedValue === "" ? undefined : typedValue });
	};

	// Build display text for the chip
	const buildDisplayText = () => {
		const columnLabel = getColumnLabel(filter.columnId);
		const operatorLabel = operatorLabels[filter.operator];

		if (!requiresValue) {
			return `${columnLabel} ${operatorLabel.toLowerCase()}`;
		}

		if (
			filter.value === undefined ||
			filter.value === null ||
			filter.value === ""
		) {
			return `${columnLabel} ${operatorLabel.toLowerCase()}...`;
		}

		// For select type, show the label instead of value
		if (filter.filterType === "select") {
			const options = getSelectOptions(filter.columnId);
			const option = options.find(
				(o) => String(o.value) === String(filter.value),
			);
			const displayValue = option?.label ?? filter.value;
			return `${columnLabel} ${operatorLabel.toLowerCase()} "${displayValue}"`;
		}

		return `${columnLabel} ${operatorLabel.toLowerCase()} "${filter.value}"`;
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border bg-muted/50 hover:bg-muted transition-colors group"
				>
					<span className="truncate max-w-48">
						{buildDisplayText()}
					</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
						className="p-0.5 -mr-1 rounded hover:bg-destructive/20 transition-colors"
						aria-label="Remove filter"
					>
						<X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
					</button>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-3" align="start">
				<div className="space-y-3">
					{/* Column selector */}
					<Select
						label="Column"
						value={filter.columnId}
						options={columnOptions}
						onChange={(columnId) => {
							const filterCol = filterableColumns.find(
								(f) => f.columnId === columnId,
							);
							if (filterCol) {
								onUpdate({
									columnId,
									filterType: filterCol.filterType,
									// Reset operator to default for new type
									operator:
										filterCol.filterType ===
										filter.filterType
											? filter.operator
											: operatorsByType[
													filterCol.filterType
												][0],
									value: undefined,
								});
							}
						}}
						classNames={{ trigger: "h-8 text-sm" }}
					/>

					{/* Operator selector */}
					<Select
						label="Operator"
						value={filter.operator}
						options={operatorOptions}
						onChange={(operator) =>
							onUpdate({
								operator: operator as FilterOperator,
								// Clear value if new operator doesn't require it
								value: operatorRequiresValue(
									operator as FilterOperator,
								)
									? filter.value
									: undefined,
							})
						}
						classNames={{ trigger: "h-8 text-sm" }}
					/>

					{/* Value input (conditional) */}
					{requiresValue && (
						<div className="space-y-1.5">
							<span className="text-xs font-medium text-muted-foreground">
								Value
							</span>
							{filter.filterType === "select" ? (
								<Select
									value={filter.value?.toString() ?? ""}
									options={valueOptions}
									onChange={handleSelectValueChange}
									placeholder="Select a value..."
									classNames={{ trigger: "h-8 text-sm" }}
								/>
							) : filter.filterType === "date" ? (
								<Input
									ref={inputRef}
									type="date"
									value={localValue}
									onChange={(e) =>
										handleSelectValueChange(e.target.value)
									}
									className="h-8 text-sm"
								/>
							) : (
								<div className="space-y-2">
									<Input
										ref={inputRef}
										type={
											filter.filterType === "number"
												? "number"
												: "text"
										}
										value={localValue}
										onChange={(e) =>
											handleLocalValueChange(
												e.target.value,
											)
										}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleApplyFilter();
											}
										}}
										placeholder="Type a value..."
										className="h-8 text-sm"
									/>
									<Button
										size="sm"
										onClick={handleApplyFilter}
										className="w-full h-7"
									>
										Apply
									</Button>
								</div>
							)}
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end pt-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={onRemove}
							className="text-destructive hover:text-destructive hover:bg-destructive/10"
						>
							Remove filter
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
