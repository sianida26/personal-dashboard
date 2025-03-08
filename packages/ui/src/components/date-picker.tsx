import { useState, useCallback } from "react";
import type { FC, ReactNode } from "react";
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
 * Props for the DatePicker component
 */
export interface DatePickerProps {
	/**
	 * The mode of date selection
	 * @default DatePickerMode.Single
	 */
	mode?: DatePickerMode;

	/**
	 * Whether to allow deselection of dates
	 * @default true
	 */
	allowDeselect?: boolean;

	/**
	 * The default selected date(s)
	 */
	defaultValue?: Date | Date[] | { from: Date; to: Date };

	/**
	 * The controlled selected date(s)
	 */
	value?: Date | Date[] | { from: Date; to: Date };

	/**
	 * Callback when date(s) selection changes
	 */
	onChange?: (value: Date | Date[] | { from: Date; to: Date } | null) => void;

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
 * DatePicker component that extends Calendar with multiple date selection, range selection,
 * and other advanced features
 */
export const DatePicker: FC<DatePickerProps> = ({
	mode = DatePickerMode.Single,
	allowDeselect = true,
	defaultValue,
	value,
	onChange,
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
}) => {
	// Initialize internal state based on controlled or uncontrolled usage
	const [internalValue, setInternalValue] = useState<
		Date | Date[] | { from: Date; to: Date } | null
	>(defaultValue || (mode === DatePickerMode.Multiple ? [] : null));

	// Determine the actual value to use (controlled or uncontrolled)
	const selectedValue = value !== undefined ? value : internalValue;

	// Handle date selection based on mode
	const handleDateSelect = useCallback(
		(date: Date) => {
			let newValue: typeof selectedValue = null;

			if (mode === DatePickerMode.Single) {
				// For single mode, toggle selection if allowDeselect is true
				if (
					selectedValue instanceof Date &&
					selectedValue.toDateString() === date.toDateString() &&
					allowDeselect
				) {
					newValue = null;
				} else {
					newValue = date;
				}
			} else if (mode === DatePickerMode.Multiple) {
				// For multiple mode, toggle dates in the array
				const currentDates = Array.isArray(selectedValue)
					? [...selectedValue]
					: [];
				const dateIndex = currentDates.findIndex(
					(d) => d.toDateString() === date.toDateString(),
				);

				if (dateIndex >= 0 && allowDeselect) {
					currentDates.splice(dateIndex, 1);
					newValue = currentDates;
				} else if (dateIndex < 0) {
					currentDates.push(date);
					newValue = currentDates;
				} else {
					newValue = currentDates;
				}
			} else if (mode === DatePickerMode.Range) {
				// For range mode, handle from/to selection
				const currentRange =
					selectedValue &&
					typeof selectedValue === "object" &&
					"from" in selectedValue
						? { ...selectedValue }
						: null;

				if (!currentRange || (currentRange.from && currentRange.to)) {
					// Start a new range
					newValue = { from: date, to: date };
				} else if (currentRange.from && !currentRange.to) {
					// Complete the range
					if (date < currentRange.from) {
						newValue = { from: date, to: currentRange.from };
					} else {
						newValue = { from: currentRange.from, to: date };
					}
				} else if (
					currentRange.from &&
					currentRange.from.toDateString() === date.toDateString() &&
					allowDeselect
				) {
					// Deselect if clicking on the same date and allowDeselect is true
					newValue = null;
				}
			}

			// Update internal state if uncontrolled
			if (value === undefined) {
				setInternalValue(newValue);
			}

			// Call onChange callback
			onChange?.(newValue);
		},
		[mode, selectedValue, allowDeselect, onChange, value],
	);

	// Check if a date is selected
	const isDateSelected = useCallback(
		(date: Date): boolean => {
			if (!selectedValue) return false;

			if (selectedValue instanceof Date) {
				return selectedValue.toDateString() === date.toDateString();
			}

			if (Array.isArray(selectedValue)) {
				return selectedValue.some(
					(d) => d.toDateString() === date.toDateString(),
				);
			}

			if ("from" in selectedValue && "to" in selectedValue) {
				const { from, to } = selectedValue;
				return date >= from && date <= to;
			}

			return false;
		},
		[selectedValue],
	);

	// Check if a date is in range (for range mode)
	const isDateInRange = useCallback(
		(date: Date): boolean => {
			if (
				!selectedValue ||
				!(typeof selectedValue === "object" && "from" in selectedValue)
			) {
				return false;
			}

			const { from, to } = selectedValue;
			return date > from && date < to;
		},
		[selectedValue],
	);

	// Check if a date is the first date in range
	const isFirstInRange = useCallback(
		(date: Date): boolean => {
			if (
				!selectedValue ||
				!(typeof selectedValue === "object" && "from" in selectedValue)
			) {
				return false;
			}

			return date.toDateString() === selectedValue.from.toDateString();
		},
		[selectedValue],
	);

	// Check if a date is the last date in range
	const isLastInRange = useCallback(
		(date: Date): boolean => {
			if (
				!selectedValue ||
				!(
					typeof selectedValue === "object" &&
					"from" in selectedValue &&
					"to" in selectedValue
				)
			) {
				return false;
			}

			return date.toDateString() === selectedValue.to.toDateString();
		},
		[selectedValue],
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

	return (
		<div className={`date-picker ${className}`}>
			<Calendar
				onDateChange={onChange}
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
