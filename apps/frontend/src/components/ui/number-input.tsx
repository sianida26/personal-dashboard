import * as React from "react";

import { cn } from "@/lib/utils";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Button } from "./button";
import { Input, type InputProps } from "./input";

export interface NumberInputProps extends InputProps {
	withoutArrows?: boolean;
	value?: number;
	min?: number;
	max?: number;
	step?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{
			className,
			id,
			defaultValue,
			value,
			min,
			max,
			onChange,
			step = 1,
			...props
		},
		ref,
	) => {
		const [localValue, setLocalValue] = React.useState<number | undefined>(
			defaultValue !== undefined ? Number(defaultValue) : undefined,
		);

		const isControlled = value !== undefined;

		const clampValue = (val: number): number => {
			if (min !== undefined && val < min) return min;
			if (max !== undefined && val > max) return max;
			return val;
		};

		const handleValueChange = (newValue: number) => {
			const clampedValue = clampValue(newValue);
			if (!isControlled) {
				setLocalValue(clampedValue);
			}
			if (onChange) {
				onChange({
					target: { value: clampedValue.toString() },
				} as React.ChangeEvent<HTMLInputElement>);
			}
		};

		const increment = () => {
			const currentValue = isControlled ? Number(value) : localValue || 0;
			handleValueChange(currentValue + step);
		};

		const decrement = () => {
			const currentValue = isControlled ? Number(value) : localValue || 0;
			handleValueChange(currentValue - step);
		};

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = Number(e.target.value);
			handleValueChange(Number.isNaN(newValue) ? 0 : newValue);
		};

		return (
			<div className="relative w-full">
				<div className="relative">
					<Input
						id={id}
						className={cn("pr-0", className)}
						ref={ref}
						type="number"
						classNames={{
							rightSection: "right-0",
						}}
						value={isControlled ? value : localValue}
						onChange={handleInputChange}
						rightSection={
							<div className="flex flex-col">
								<Button
									variant="outline"
									className="py-0 h-1/2 px-1.5"
									onClick={increment}
								>
									<LuChevronUp />
								</Button>
								<Button
									variant="outline"
									className="py-0 h-1/2 px-1.5"
									onClick={decrement}
								>
									<LuChevronDown />
								</Button>
							</div>
						}
						{...props}
					/>
				</div>
			</div>
		);
	},
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
