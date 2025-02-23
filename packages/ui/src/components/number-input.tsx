import * as React from "react";
import { Input, type InputProps } from "./input";
import { cn } from "../utils";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

/**
 * Extends InputProps for numeric-specific behavior.
 */
export interface NumberInputProps
		extends Omit<InputProps, "type" | "value" | "onChange"> {
		/**
		 * Current numeric value (controlled).
		 */
		value?: number;
		/**
		 * Default numeric value (uncontrolled).
		 */
		defaultValue?: number;
		/**
		 * Callback when value changes (numeric).
		 */
		onChange?(value: number): void;
		/**
		 * Minimum value allowed.
		 */
		min?: number;
		/**
		 * Maximum value allowed.
		 */
		max?: number;
		/**
		 * Increment/decrement step.
		 */
		step?: number;
		/**
		 * Determine how clamping is applied.
		 * "none" - do not clamp the value.
		 * "blur" - clamp the value on blur.
		 * "strict" - clamp the value immediately on change.
		 */
		clampBehavior?: "none" | "blur" | "strict";
	}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{
			value,
			defaultValue,
			onChange,
			min,
			max,
			step = 1,
			clampBehavior = "blur",
			...props
		},
		ref,
	) => {
		// Are we controlled?
		const isControlled = value !== undefined;

		// Keep a string state so the user can freely type (including empty).
		const [internalValue, setInternalValue] = React.useState<string>(() => {
			if (isControlled && value != null) return String(value);
			if (defaultValue != null) return String(defaultValue);
			return "";
		});

		// Keep internalValue in sync if controlled
		React.useEffect(() => {
			if (isControlled) {
				setInternalValue(value != null ? String(value) : "");
			}
		}, [isControlled, value]);

		const parseValue = (val: string) => {
			const numeric = Number.parseFloat(val);
			return Number.isNaN(numeric) ? null : numeric;
		};

		const clampValue = (val: number) => {
			let clamped = val;
			if (min !== undefined && clamped < min) clamped = min;
			if (max !== undefined && clamped > max) clamped = max;
			return clamped;
		};

		/**
		 * Apply logic to final value:
		 * - If user typed a valid number, clamp if needed.
		 * - If user typed empty or invalid, fall back to min if present, otherwise 0.
		 */
		const commitValue = (raw: string) => {
			const parsed = parseValue(raw);

			let finalVal: number;
			if (parsed === null) {
				// user typed empty or invalid
				finalVal = min !== undefined ? min : 0;
			} else {
				finalVal =
					clampBehavior === "strict" ? clampValue(parsed) : parsed;
			}

			if (!isControlled) {
				setInternalValue(String(finalVal));
			}
			onChange?.(clampValue(finalVal));
		};

		const handleInputChange = (
			event: React.ChangeEvent<HTMLInputElement>,
		) => {
			const rawValue = event.target.value;

			if (clampBehavior === "strict") {
				// Immediately clamp on each change
				commitValue(rawValue);
			} else {
				// Let user type freely; store raw input
				if (!isControlled) {
					setInternalValue(rawValue);
				}
				// Call onChange with numeric value or NaN
				const parsed = parseValue(rawValue);
				onChange?.(parsed ?? Number.NaN);
			}
		};

		const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
			// Only clamp on blur if clampBehavior === "blur"
			if (clampBehavior === "blur") {
				commitValue(internalValue);
			}
			props.onBlur?.(event);
		};

		const increment = () => {
			const parsed = parseValue(internalValue) ?? 0;
			commitValue(String(parsed + step));
		};

		const decrement = () => {
			const parsed = parseValue(internalValue) ?? 0;
			commitValue(String(parsed - step));
		};

		// Right section with up/down arrows
		const rightSection = (
			<div className="flex flex-col h-full">
				<button
					type="button"
					onClick={increment}
					className="flex items-center h-full justify-center leading-none w-6 hover:bg-primary/10"
				>
					<LuChevronUp />
				</button>
				<button
					type="button"
					onClick={decrement}
					className="flex items-center h-full justify-center leading-none w-6 hover:bg-primary/10"
				>
					<LuChevronDown />
				</button>
			</div>
		);

		return (
			<Input
				ref={ref}
				{...props}
				type="number"
				value={internalValue}
				onChange={handleInputChange}
				onBlur={handleBlur}
				rightSection={rightSection}
				classNames={{
					rightSection:
						"right-[0.4px] h-full rounded-r-sm overflow-clip",
				}}
			/>
		);
	},
);

NumberInput.displayName = "NumberInput";
