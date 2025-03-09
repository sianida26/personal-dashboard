import {
	useState,
	useRef,
	useEffect,
	useCallback,
	forwardRef,
	type Ref,
} from "react";
import {
	DatePicker,
	type DatePickerProps,
	type DatePickerMode,
	type DateRange,
} from "./date-picker";
import { Input, type InputProps } from "./input";
import { cn } from "../utils";

/**
 * DatePickerInput Props that combines functionality of Input and DatePicker
 */
export interface DatePickerInputProps<TMode extends DatePickerMode = "single">
	extends Omit<InputProps, "onChange" | "value" | "defaultValue"> {
	/**
	 * The mode of date selection
	 * @default "single"
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
	defaultValue?: DatePickerProps<TMode>["defaultValue"];

	/**
	 * The controlled selected date(s)
	 */
	value?: DatePickerProps<TMode>["value"];

	/**
	 * Callback when date(s) selection changes
	 */
	onChange?: DatePickerProps<TMode>["onChange"];

	/**
	 * Date format string for displaying in the input
	 * @default "MMMM d, yyyy" for single, custom for multiple/range
	 */
	dateFormat?: string;

	/**
	 * Placeholder text when no date is selected
	 * @default "Select date" or mode-specific variant
	 */
	placeholder?: string;

	/**
	 * Additional props to pass to the DatePicker component
	 */
	datePickerProps?: Omit<
		DatePickerProps<TMode>,
		"mode" | "allowDeselect" | "defaultValue" | "value" | "onChange"
	>;
}

/**
 * Formats a date using the specified format or a default format
 */
const formatDate = (date: Date) => {
	if (!date) return "";

	try {
		return new Intl.DateTimeFormat("en", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	} catch (error) {
		console.error("Error formatting date:", error);
		return date.toDateString();
	}
};

/**
 * Formats dates based on the DatePicker mode
 */
const formatDateValue = <TMode extends DatePickerMode = "single">(
	value: DatePickerProps<TMode>["value"] | null | undefined,
	mode: TMode,
) => {
	if (!value) return "";

	if (mode === "single") {
		const singleValue = value as Date | null;
		return singleValue ? formatDate(singleValue) : "";
	}

	if (mode === "multiple") {
		const dates = value as Date[];
		if (dates.length === 0) return "";
		if (dates.length === 1 && dates[0]) return formatDate(dates[0]);
		return `${dates.length} dates selected`;
	}

	if (mode === "range") {
		const range = value as DateRange;
		if (!range) return "";

		if (range.from && range.to) {
			return `${formatDate(range.from)} - ${formatDate(range.to)}`;
		}

		if (range.from) {
			return formatDate(range.from);
		}

		return "";
	}

	return "";
};

/**
 * Component that combines an Input and DatePicker, showing the DatePicker in a Popover when the Input is clicked
 */
export const DatePickerInput = forwardRef<
	HTMLInputElement,
	DatePickerInputProps<DatePickerMode>
>(
	<TMode extends DatePickerMode = "single">(
		{
			mode = "single" as TMode,
			allowDeselect = true,
			defaultValue,
			value,
			onChange,
			dateFormat: _dateFormat, // Unused, kept for API compatibility
			placeholder,
			className,
			datePickerProps,
			...inputProps
		}: DatePickerInputProps<TMode>,
		ref: Ref<HTMLInputElement>,
	) => {
		const [isOpen, setIsOpen] = useState(false);
		const containerRef = useRef<HTMLDivElement>(null);

		// Determine appropriate placeholder based on mode
		const defaultPlaceholder =
			mode === "single"
				? "Select date"
				: mode === "multiple"
					? "Select dates"
					: "Select date range";

		const displayPlaceholder = placeholder ?? defaultPlaceholder;

		// Format the displayed value based on mode
		const displayValue = value
			? formatDateValue(value, mode)
			: defaultValue
				? formatDateValue(defaultValue, mode)
				: "";

		// Handle date changes with proper type handling
		const handleDateChange = useCallback(
			// We use a type assertion here to handle the different possible onChange signatures
			(newValue: DatePickerProps<TMode>["value"]) => {
				if (onChange) {
					if (mode === "single") {
						(onChange as (value: Date | null) => void)(
							newValue as Date | null,
						);
					} else if (mode === "multiple") {
						(onChange as (value: Date[]) => void)(
							newValue as Date[],
						);
					} else if (mode === "range") {
						(onChange as (value: DateRange) => void)(
							newValue as DateRange,
						);
					}
				}

				// Close popover for single mode or when range is complete
				if (
					mode === "single" ||
					(mode === "range" && (newValue as DateRange)?.to)
				) {
					setIsOpen(false);
				}
			},
			[onChange, mode],
		);

		// Close when clicking outside
		useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					containerRef.current &&
					!containerRef.current.contains(event.target as Node)
				) {
					setIsOpen(false);
				}
			};

			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}, []);

		return (
			<div
				ref={containerRef}
				className={cn("date-picker-input relative", className)}
			>
				<Input
					{...inputProps}
					ref={ref}
					value={displayValue}
					placeholder={displayPlaceholder}
					onClick={() => setIsOpen(true)}
					readOnly
					classNames={{
						...inputProps.classNames,
						input: cn(
							inputProps.classNames?.input,
							"cursor-pointer",
						),
					}}
					rightSection={
						inputProps.rightSection || (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 text-gray-400"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
									clipRule="evenodd"
								/>
							</svg>
						)
					}
				/>

				{isOpen && (
					<div className="absolute z-50 mt-1">
						<DatePicker
							mode={mode}
							allowDeselect={allowDeselect}
							value={value}
							onChange={
								handleDateChange as DatePickerProps<TMode>["onChange"]
							}
							className="bg-white border border-gray-200 rounded-md shadow-lg p-1"
							{...datePickerProps}
						/>
					</div>
				)}
			</div>
		);
	},
);

// Add displayName for debugging
DatePickerInput.displayName = "DatePickerInput"; 