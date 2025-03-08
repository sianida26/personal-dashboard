import { useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { Calendar, Day } from "./calendar";

/**
 * Enum for the selection mode of the DatePicker
 */
export enum DatePickerMode {
	Single = "single",
	Multiple = "multiple",
	Range = "range",
}

/**
 * Type for a date range with from/to properties
 */
export type DateRange = {
	from: Date;
	to: Date;
};

/**
 * Type for a date range represented as a tuple
 */
export type DateRangeTuple = [Date | null, Date | null];

/**
 * Props for the DatePicker component with generic type parameter for mode-specific value types
 */
export interface DatePickerProps<
	TMode extends DatePickerMode = DatePickerMode.Single,
> {
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
	defaultValue?: TMode extends DatePickerMode.Single
		? Date | null
		: TMode extends DatePickerMode.Multiple
			? Date[]
			: DateRange | DateRangeTuple;

	/**
	 * The controlled selected date(s)
	 */
	value?: TMode extends DatePickerMode.Single
		? Date | null
		: TMode extends DatePickerMode.Multiple
			? Date[]
			: DateRange | DateRangeTuple;

	/**
	 * Callback when date(s) selection changes
	 */
	onChange?: TMode extends DatePickerMode.Single
		? (value: Date | null) => void
		: TMode extends DatePickerMode.Multiple
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
export const DatePicker = <
	TMode extends DatePickerMode = DatePickerMode.Single,
>({
	mode = DatePickerMode.Single as TMode,
	allowDeselect = true,
	defaultValue,
	value,
	onChange,
	defaultVisibleDate,
	minDate,
	maxDate,
	highlightToday = true,
	excludeDate,
	renderDay,
	firstDayOfWeek = 1,
	hideOutsideDates = false,
	hideWeekdays = false,
	locale = "default",
	monthLabelFormat,
	monthsListFormat,
	nextIcon,
	prevIcon,
	className = "",
}: DatePickerProps<TMode>) => {
	// Initialize internal state based on controlled or uncontrolled usage
	const [internalSingleValue, setInternalSingleValue] = useState<Date | null>(
		mode === DatePickerMode.Single
			? (defaultValue as Date | null) || null
			: null,
	);

	const [internalMultipleValue, setInternalMultipleValue] = useState<Date[]>(
		mode === DatePickerMode.Multiple ? (defaultValue as Date[]) || [] : [],
	);

	const [internalRangeValue, setInternalRangeValue] =
		useState<DateRange | null>(() => {
			if (mode !== DatePickerMode.Range) return null;

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

	// Determine the actual value to use (controlled or uncontrolled)
	const selectedSingleValue =
		mode === DatePickerMode.Single
			? value !== undefined
				? (value as Date | null)
				: internalSingleValue
			: null;

	const selectedMultipleValue =
		mode === DatePickerMode.Multiple
			? value !== undefined
				? (value as Date[])
				: internalMultipleValue
			: [];

	const selectedRangeValue =
		mode === DatePickerMode.Range
			? (() => {
					if (value === undefined) return internalRangeValue;

					const rangeValue = value as DateRange | DateRangeTuple;
					if (isDateRange(rangeValue)) return rangeValue;
					if (isDateRangeTuple(rangeValue))
						return tupleToRange(rangeValue);

					return null;
				})()
			: null;

	// Calculate the initial visible date
	const initialVisibleDate = useMemo(() => {
		if (defaultVisibleDate) return defaultVisibleDate;

		if (mode === DatePickerMode.Single && selectedSingleValue) {
			return selectedSingleValue;
		}

		if (
			mode === DatePickerMode.Multiple &&
			selectedMultipleValue.length > 0
		) {
			return selectedMultipleValue[0];
		}

		if (mode === DatePickerMode.Range && selectedRangeValue) {
			return selectedRangeValue.from;
		}

		return new Date();
	}, [
		defaultVisibleDate,
		mode,
		selectedSingleValue,
		selectedMultipleValue,
		selectedRangeValue,
	]);

	// State for the currently visible date in the calendar
	const [visibleDate, setVisibleDate] = useState<Date | null>(
		initialVisibleDate ?? null,
	);

	// Handle date selection based on mode
	const handleDateSelect = useCallback(
		(date: Date) => {
			if (mode === DatePickerMode.Single) {
				// For single mode, toggle selection if allowDeselect is true
				let newValue: Date | null = date;

				if (
					selectedSingleValue &&
					selectedSingleValue.toDateString() ===
						date.toDateString() &&
					allowDeselect
				) {
					newValue = null;
				}

				// Update internal state if uncontrolled
				if (value === undefined) {
					setInternalSingleValue(newValue);
				}

				// Call onChange callback
				(onChange as ((value: Date | null) => void) | undefined)?.(
					newValue,
				);
			} else if (mode === DatePickerMode.Multiple) {
				// For multiple mode, toggle dates in the array
				const currentDates = [...selectedMultipleValue];
				const dateIndex = currentDates.findIndex(
					(d) => d.toDateString() === date.toDateString(),
				);

				if (dateIndex >= 0 && allowDeselect) {
					currentDates.splice(dateIndex, 1);
				} else if (dateIndex < 0) {
					currentDates.push(date);
				}

				// Update internal state if uncontrolled
				if (value === undefined) {
					setInternalMultipleValue(currentDates);
				}

				// Call onChange callback
				(onChange as ((value: Date[]) => void) | undefined)?.(
					currentDates,
				);
			} else if (mode === DatePickerMode.Range) {
				// For range mode, handle from/to selection
				let newValue: DateRange | null = null;

				if (
					!selectedRangeValue ||
					(selectedRangeValue.from && selectedRangeValue.to)
				) {
					// Start a new range
					newValue = { from: date, to: date };
				} else if (selectedRangeValue.from) {
					// Complete the range
					if (date < selectedRangeValue.from) {
						newValue = { from: date, to: selectedRangeValue.from };
					} else {
						newValue = { from: selectedRangeValue.from, to: date };
					}
				}

				// Handle deselection
				if (
					selectedRangeValue?.from &&
					selectedRangeValue.from.toDateString() ===
						date.toDateString() &&
					selectedRangeValue.to &&
					selectedRangeValue.to.toDateString() ===
						date.toDateString() &&
					allowDeselect
				) {
					newValue = null;
				}

				// Update internal state if uncontrolled
				if (value === undefined) {
					setInternalRangeValue(newValue);
				}

				// Call onChange callback
				const changeHandler = onChange as
					| ((value: DateRange | DateRangeTuple | null) => void)
					| undefined;

				// Check if we need to convert to tuple format based on the original value type
				if (changeHandler) {
					if (
						value !== undefined &&
						isDateRangeTuple(value as DateRange | DateRangeTuple)
					) {
						changeHandler(
							newValue ? rangeToTuple(newValue) : [null, null],
						);
					} else {
						changeHandler(newValue);
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
			if (mode === DatePickerMode.Single && selectedSingleValue) {
				return (
					selectedSingleValue.toDateString() === date.toDateString()
				);
			}

			if (mode === DatePickerMode.Multiple) {
				return selectedMultipleValue.some(
					(d) => d.toDateString() === date.toDateString(),
				);
			}

			if (mode === DatePickerMode.Range && selectedRangeValue) {
				const { from, to } = selectedRangeValue;
				return date >= from && date <= to;
			}

			return false;
		},
		[mode, selectedSingleValue, selectedMultipleValue, selectedRangeValue],
	);

	// Check if a date is in range (for range mode)
	const isDateInRange = useCallback(
		(date: Date): boolean => {
			if (mode !== DatePickerMode.Range || !selectedRangeValue) {
				return false;
			}

			const { from, to } = selectedRangeValue;
			return date > from && date < to;
		},
		[mode, selectedRangeValue],
	);

	// Check if a date is the first date in range
	const isFirstInRange = useCallback(
		(date: Date): boolean => {
			if (mode !== DatePickerMode.Range || !selectedRangeValue) {
				return false;
			}

			return (
				date.toDateString() === selectedRangeValue.from.toDateString()
			);
		},
		[mode, selectedRangeValue],
	);

	// Check if a date is the last date in range
	const isLastInRange = useCallback(
		(date: Date): boolean => {
			if (mode !== DatePickerMode.Range || !selectedRangeValue) {
				return false;
			}

			return date.toDateString() === selectedRangeValue.to.toDateString();
		},
		[mode, selectedRangeValue],
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
					renderDay={renderDay}
					highlightToday={highlightToday}
					onClick={() => handleDateSelect(date)}
				/>
			);
		},
		[
			isDateSelected,
			isDateInRange,
			isFirstInRange,
			isLastInRange,
			renderDay,
			highlightToday,
			handleDateSelect,
		],
	);

	// Create a custom excludeDate function that combines the provided one with our own logic
	const combinedExcludeDate = useCallback(
		(date: Date) => {
			if (excludeDate?.(date)) return true;
			if (minDate && date < minDate) return true;
			if (maxDate && date > maxDate) return true;
			return false;
		},
		[excludeDate, minDate, maxDate],
	);

	// Handle date change in the calendar
	const handleDateChange = useCallback((date: Date) => {
		setVisibleDate(date);
	}, []);

	return (
		<div className={`date-picker ${className}`}>
			<Calendar
				date={visibleDate || new Date()}
				onDateChange={handleDateChange}
				excludeDate={combinedExcludeDate}
				renderDay={renderDayWithSelection}
				firstDayOfWeek={firstDayOfWeek}
				hideOutsideDates={hideOutsideDates}
				hideWeekdays={hideWeekdays}
				highlightToday={highlightToday}
				locale={locale}
				monthLabelFormat={monthLabelFormat}
				monthsListFormat={monthsListFormat}
				nextIcon={nextIcon}
				prevIcon={prevIcon}
			/>
		</div>
	);
};

export default DatePicker;
