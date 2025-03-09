import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { Calendar, type CalendarProps, Day } from "./calendar";

/**
 * Enum for the selection mode of the DatePicker
 */
export type DatePickerMode = "single" | "multiple" | "range";

/**
 * Type for a date range with from/to properties
 */
export type DateRange = {
		from: Date;
		to: Date | null;
	};

/**
 * Type for a date range represented as a tuple
 */
export type DateRangeTuple = [Date | null, Date | null];

/**
 * Props for the DatePicker component with generic type parameter for mode-specific value types
 */
export interface DatePickerProps<TMode extends DatePickerMode = "single">
	extends Omit<CalendarProps, "date" | "onDateChange"> {
	/**
	 * The mode of date selection
	 * @default DatePickerMode.Single
	 */
	mode?: TMode;

	/**
	 * Whether to allow deselection of dates
	 * @default true
	 */
	allowDeselect?: boolean;

	/**
	 * The default selected date(s)
	 */
	defaultValue?: TMode extends "single"
		? Date | null
		: TMode extends "multiple"
			? Date[]
			: DateRange | DateRangeTuple;

	/**
	 * The controlled selected date(s)
	 */
	value?: TMode extends "single"
		? Date | null
		: TMode extends "multiple"
			? Date[]
			: DateRange | DateRangeTuple;

	/**
	 * Callback when date(s) selection changes
	 */
	onChange?: TMode extends "single"
		? (value: Date | null) => void
		: TMode extends "multiple"
			? (value: Date[]) => void
			: (value: DateRange | DateRangeTuple | null) => void;

	/**
	 * The default visible date in the calendar
	 */
	defaultVisibleDate?: Date;

	/**
	 * The minimum selectable date
	 */
	minDate?: Date;

	/**
	 * The maximum selectable date
	 */
	maxDate?: Date;

	/**
	 * Whether to highlight today's date
	 * @default true
	 */
	highlightToday?: boolean;

	/**
	 * Function to determine if a date should be disabled
	 */
	excludeDate?: (date: Date) => boolean;

	/**
	 * Custom render function for day cells
	 */
	renderDay?: (date: Date) => ReactNode;

	/**
	 * First day of the week (0 = Sunday, 1 = Monday, etc.)
	 * @default 1
	 */
	firstDayOfWeek?: number;

	/**
	 * Whether to hide dates outside the current month
	 * @default false
	 */
	hideOutsideDates?: boolean;

	/**
	 * Whether to hide weekday names
	 * @default false
	 */
	hideWeekdays?: boolean;

	/**
	 * Locale for date formatting
	 * @default "default"
	 */
	locale?: string;

	/**
	 * Format for month labels
	 */
	monthLabelFormat?: string | ((month: Date) => ReactNode);

	/**
	 * Format for months list
	 */
	monthsListFormat?: string;

	/**
	 * Custom next icon
	 */
	nextIcon?: ReactNode;

	/**
	 * Custom previous icon
	 */
	prevIcon?: ReactNode;

	/**
	 * Additional className for the component
	 */
	className?: string;
}

/**
 * Type guard to check if a value is a DateRange object
 */
function isDateRange(value: unknown): value is DateRange {
	return (
		value !== null &&
		typeof value === "object" &&
		"from" in value &&
		"to" in value
	);
}

/**
 * Type guard to check if a value is a DateRangeTuple
 */
function isDateRangeTuple(value: unknown): value is DateRangeTuple {
	return Array.isArray(value) && value.length === 2;
}

/**
 * Convert a DateRangeTuple to a DateRange object
 */
function tupleToRange(tuple: DateRangeTuple): DateRange | null {
	const [from, to] = tuple;
	if (!from || !to) return null;
	return { from, to };
}

/**
 * Convert a DateRange object to a DateRangeTuple
 */
function rangeToTuple(range: DateRange | null): DateRangeTuple {
	if (!range) return [null, null];
	return [range.from, range.to];
}

/**
 * DatePicker component that extends Calendar with multiple date selection, range selection,
 * and other advanced features
 */
export const DatePicker = <TMode extends DatePickerMode = "single">({
	mode = "single" as TMode,
	allowDeselect = true,
	defaultValue,
	value,
	onChange,
	defaultVisibleDate,
	...calendarProps
}: DatePickerProps<TMode>) => {
	// Initialize internal state based on controlled or uncontrolled usage
	const [internalSingleValue, setInternalSingleValue] = useState<Date | null>(
		mode === "single"
			? ((defaultValue as Date | null) ?? new Date())
			: null,
	);

	const [internalMultipleValue, setInternalMultipleValue] = useState<Date[]>(
		mode === "multiple" ? (defaultValue as Date[]) || [] : [],
	);

	const [internalRangeValue, setInternalRangeValue] =
		useState<DateRange | null>(() => {
			if (mode !== "range") return null;

			const defaultRangeValue = defaultValue as
				| DateRange
				| DateRangeTuple
				| undefined;

			if (!defaultRangeValue) return null;
			if (isDateRange(defaultRangeValue)) return defaultRangeValue;
			if (isDateRangeTuple(defaultRangeValue))
				return tupleToRange(defaultRangeValue);

			return null;
		});

	// Add hover state for range selection
	const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

	// Clear hover state when selection changes
	useEffect(() => {
		setHoveredDate(null);
	}, [internalSingleValue, internalMultipleValue, internalRangeValue]);

	// Determine the actual value to use (controlled or uncontrolled)
	const selectedSingleValue =
		mode === "single"
			? value !== undefined
				? (value as Date | null)
				: internalSingleValue
			: null;

	const selectedMultipleValue =
		mode === "multiple"
			? value !== undefined
				? (value as Date[])
				: internalMultipleValue
			: [];

	const selectedRangeValue =
		mode === "range"
			? (() => {
					if (value === undefined) return internalRangeValue;

					const rangeValue = value as DateRange | DateRangeTuple;
					if (isDateRange(rangeValue)) return rangeValue;
					if (isDateRangeTuple(rangeValue))
						return tupleToRange(rangeValue);

					return null;
				})()
			: null;

	// Handle date selection based on mode
	const handleDateSelect = useCallback(
		(date: Date) => {
			if (mode === "single") {
				// Single mode logic
				let newValue: Date | null = date;

				if (
					selectedSingleValue &&
					selectedSingleValue.toDateString() ===
						date.toDateString() &&
					allowDeselect
				) {
					newValue = null;
				}

				if (value === undefined) {
					setInternalSingleValue(newValue);
				}

				(onChange as ((value: Date | null) => void) | undefined)?.(
					newValue,
				);
			} else if (mode === "multiple") {
				// Multiple mode logic
				const currentDates = [...selectedMultipleValue];
				const dateIndex = currentDates.findIndex(
					(d) => d.toDateString() === date.toDateString(),
				);

				if (dateIndex >= 0 && allowDeselect) {
					currentDates.splice(dateIndex, 1);
				} else if (dateIndex < 0) {
					currentDates.push(date);
				}

				if (value === undefined) {
					setInternalMultipleValue(currentDates);
				}

				(onChange as ((value: Date[]) => void) | undefined)?.(
					currentDates,
				);
			} else if (mode === "range") {
				// Range mode logic
				let newRange: DateRange | null = null;

				// Case 1: No range exists yet - start a new range
				if (!selectedRangeValue) {
					newRange = { from: date, to: null };
				}
				// Case 2: Complete range exists - start a new range or deselect if same date
				else if (selectedRangeValue.from && selectedRangeValue.to) {
					const isSameAsFrom =
						selectedRangeValue.from.toDateString() ===
						date.toDateString();
					const isSameAsTo =
						selectedRangeValue.to.toDateString() ===
						date.toDateString();
					const isSelected = isSameAsFrom || isSameAsTo;

					if (isSelected && allowDeselect) {
						newRange = null;
					} else {
						newRange = { from: date, to: null };
					}
				}
				// Case 3: Only start date exists - complete the range or deselect if same date
				else if (selectedRangeValue.from) {
					if (
						selectedRangeValue.from.toDateString() ===
							date.toDateString() &&
						allowDeselect
					) {
						newRange = null;
					} else {
						// Complete the range with correct order
						const first = selectedRangeValue.from;
						const second = date;

						if (first <= second) {
							newRange = { from: first, to: second };
						} else {
							newRange = { from: second, to: first };
						}
					}
				}

				// Update internal state if uncontrolled
				if (value === undefined) {
					setInternalRangeValue(newRange);
				}

				// Call onChange callback
				const changeHandler = onChange as
					| ((value: DateRange | DateRangeTuple | null) => void)
					| undefined;

				if (changeHandler) {
					// Convert to tuple if the original value was a tuple
					if (
						value !== undefined &&
						isDateRangeTuple(value as DateRange | DateRangeTuple)
					) {
						changeHandler(
							newRange ? rangeToTuple(newRange) : [null, null],
						);
					} else {
						changeHandler(newRange);
					}
				}
			}
		},
		[
			mode,
			selectedSingleValue,
			selectedMultipleValue,
			selectedRangeValue,
			allowDeselect,
			onChange,
			value,
		],
	);

	// Check if a date is selected
	const isDateSelected = useCallback(
		(date: Date): boolean => {
			if (mode === "single" && selectedSingleValue) {
				return (
					selectedSingleValue.toDateString() === date.toDateString()
				);
			}

			if (mode === "multiple") {
				return selectedMultipleValue.some(
					(d) => d.toDateString() === date.toDateString(),
				);
			}

			if (mode === "range" && selectedRangeValue) {
				const { from, to } = selectedRangeValue;

				if (from && !to) {
					return date.toDateString() === from.toDateString();
				}

				// if (from && to) {
				// 	const min = from < to ? from : to;
				// 	const max = from < to ? to : from;
				// 	return date >= min && date <= max;
				// }
			}

			return false;
		},
		[mode, selectedSingleValue, selectedMultipleValue, selectedRangeValue],
	);

	// Check if a date is in range (for range mode)
	const isDateInRange = useCallback(
		(date: Date): boolean => {
			if (mode !== "range") {
				return false;
			}

			// Complete range selection
			if (selectedRangeValue?.from && selectedRangeValue?.to) {
				const { from, to } = selectedRangeValue;
				if (from.getTime() === to.getTime()) {
					return false;
				}
				const min = from < to ? from : to;
				const max = from < to ? to : from;
				return date > min && date < max;
			}

			// Hover state when selecting range
			if (selectedRangeValue?.from && hoveredDate) {
				if (
					selectedRangeValue.from.getTime() === hoveredDate.getTime()
				) {
					return false;
				}
				const min =
					selectedRangeValue.from < hoveredDate
						? selectedRangeValue.from
						: hoveredDate;
				const max =
					selectedRangeValue.from < hoveredDate
						? hoveredDate
						: selectedRangeValue.from;
				return date > min && date < max;
			}

			return false;
		},
		[mode, selectedRangeValue, hoveredDate],
	);

	// Check if a date is the first date in range
	const isFirstInRange = useCallback(
		(date: Date): boolean => {
			if (mode !== "range") {
				return false;
			}

			if (!selectedRangeValue?.from) {
				return false;
			}

			// Complete range selection
			if (selectedRangeValue.to) {
				const min =
					selectedRangeValue.from < selectedRangeValue.to
						? selectedRangeValue.from
						: selectedRangeValue.to;
				return date.toDateString() === min.toDateString();
			}

			// Hover range
			if (hoveredDate) {
				const min =
					selectedRangeValue.from < hoveredDate
						? selectedRangeValue.from
						: hoveredDate;
				return date.toDateString() === min.toDateString();
			}

			// Single date selection
			return (
				date.toDateString() === selectedRangeValue.from.toDateString()
			);
		},
		[mode, selectedRangeValue, hoveredDate],
	);

	// Check if a date is the last date in range
	const isLastInRange = useCallback(
		(date: Date): boolean => {
			if (mode !== "range") {
				return false;
			}

			if (!selectedRangeValue?.from) {
				return false;
			}

			// Complete range selection
			if (selectedRangeValue.to) {
				const max =
					selectedRangeValue.from < selectedRangeValue.to
						? selectedRangeValue.to
						: selectedRangeValue.from;
				return date.toDateString() === max.toDateString();
			}

			// Hover range
			if (hoveredDate) {
				const max =
					selectedRangeValue.from < hoveredDate
						? hoveredDate
						: selectedRangeValue.from;
				return date.toDateString() === max.toDateString();
			}

			// Single date selection (it's both first and last)
			return (
				date.toDateString() === selectedRangeValue.from.toDateString()
			);
		},
		[mode, selectedRangeValue, hoveredDate],
	);

	// Custom day rendering with selection state
	const renderDayWithSelection = useCallback(
		(date: Date) => {
			const selected = isDateSelected(date);
			const inRange = isDateInRange(date);
			const firstInRange = isFirstInRange(date);
			const lastInRange = isLastInRange(date);

			return (
				<Day
					date={date}
					selected={selected}
					inRange={inRange}
					firstInRange={firstInRange}
					lastInRange={lastInRange}
					renderDay={calendarProps.renderDay}
					highlightToday={calendarProps.highlightToday}
					onClick={() => handleDateSelect(date)}
				/>
			);
		},
		[
			isDateSelected,
			isDateInRange,
			isFirstInRange,
			isLastInRange,
			handleDateSelect,
			calendarProps.renderDay,
			calendarProps.highlightToday,
		],
	);

	// Create custom excludeDate function that combines the provided one with our own logic
	const combinedExcludeDate = useCallback(
		(date: Date) => {
			if (calendarProps.excludeDate?.(date)) return true;
			if (calendarProps.minDate && date < calendarProps.minDate)
				return true;
			if (calendarProps.maxDate && date > calendarProps.maxDate)
				return true;
			return false;
		},
		[
			calendarProps.excludeDate,
			calendarProps.minDate,
			calendarProps.maxDate,
		],
	);

	// Use defaultVisibleDate or the selected date as the initial visible date
	const [visibleDate, setVisibleDate] = useState<Date>(() => {
		if (defaultVisibleDate) return defaultVisibleDate;
		if (mode === "single" && selectedSingleValue) {
			return selectedSingleValue;
		}
		if (mode === "range" && selectedRangeValue?.from) {
			return selectedRangeValue.from;
		}
		return new Date(); // Always default to today
	});

	// Handle calendar navigation without changing selection
	const handleCalendarDateChange = (newDate: Date) => {
		handleDateSelect(newDate);
	};

	// Create custom getDayProps to handle hover and range selection
	const getDayProps = useCallback(
		(date: Date) => {
			if (mode === "range") {
				return {
					onMouseEnter: () => setHoveredDate(date),
					onMouseLeave: () => setHoveredDate(null),
					onClick: (e: React.MouseEvent) => {
						e.preventDefault();
						e.stopPropagation();
						handleDateSelect(date);
					},
				};
			}

			return {
				onClick: (e: React.MouseEvent) => {
					e.preventDefault();
					e.stopPropagation();
					handleDateSelect(date);
				},
			};
		},
		[mode, handleDateSelect, setHoveredDate],
	);

	return (
		<div className={`date-picker ${calendarProps.className || ""}`}>
			<Calendar
				{...calendarProps}
				date={visibleDate}
				onDateChange={handleCalendarDateChange}
				excludeDate={combinedExcludeDate}
				renderDay={renderDayWithSelection}
				getDayProps={getDayProps}
				selected={mode === "single" ? selectedSingleValue : null}
				onNextMonth={() =>
					setVisibleDate(
						(prev) =>
							new Date(
								prev.getFullYear(),
								prev.getMonth() + 1,
								1,
							),
					)
				}
				onPrevMonth={() =>
					setVisibleDate(
						(prev) =>
							new Date(
								prev.getFullYear(),
								prev.getMonth() - 1,
								1,
							),
					)
				}
				onNextYear={() =>
					setVisibleDate(
						(prev) =>
							new Date(
								prev.getFullYear() + 1,
								prev.getMonth(),
								1,
							),
					)
				}
				onPrevYear={() =>
					setVisibleDate(
						(prev) =>
							new Date(
								prev.getFullYear() - 1,
								prev.getMonth(),
								1,
							),
					)
				}
				onNextDecade={() =>
					setVisibleDate(
						(prev) =>
							new Date(
								prev.getFullYear() + 10,
								prev.getMonth(),
								1,
							),
					)
				}
				onPrevDecade={() =>
					setVisibleDate(
						(prev) =>
							new Date(
								prev.getFullYear() - 10,
								prev.getMonth(),
								1,
							),
					)
				}
			/>
		</div>
	);
};

export default DatePicker;
