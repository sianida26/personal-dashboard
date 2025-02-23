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
	 * Callback when value changes.
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
			// Spread the rest to pass down to Input
			...props
		},
		ref,
	) => {
		const [internalValue, setInternalValue] = React.useState<number>(
			value ?? defaultValue ?? 0,
		);

		// Derive controlled vs. uncontrolled
		const currentValue = value ?? internalValue;
		const isControlled = value !== undefined;

		const clampValue = (val: number) => {
			if (min !== undefined && val < min) return min;
			if (max !== undefined && val > max) return max;
			return val;
		};

		const handleValueChange = (newVal: number) => {
			const clamped = clampValue(newVal);
			if (!isControlled) {
				setInternalValue(clamped);
			}
			onChange?.(clamped);
		};

		const increment = () => {
			handleValueChange(currentValue + step);
		};

		const decrement = () => {
			handleValueChange(currentValue - step);
		};

		const handleInputChange = (
			event: React.ChangeEvent<HTMLInputElement>,
		) => {
			const numericVal = Number.parseFloat(event.target.value);
			if (!Number.isNaN(numericVal)) {
				handleValueChange(numericVal);
			} else {
				// If user deletes everything, treat as 0 or min
				handleValueChange(min ?? 0);
			}
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
				// Force type to number to display numeric keyboard, etc.
				type="number"
				value={String(currentValue)}
				onChange={handleInputChange}
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
