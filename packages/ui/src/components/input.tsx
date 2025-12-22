import * as React from "react";
import { cn } from "../utils";
import { Label } from "./label";

export interface InputProps extends React.ComponentProps<"input"> {
	/**
	 * Optional element displayed when there is an error.
	 */
	error?: React.ReactNode;

	/**
	 * Optional element rendered on the left side of the input.
	 */
	leftSection?: React.ReactNode;

	/**
	 * Optional element rendered on the right side of the input.
	 */
	rightSection?: React.ReactNode;

	/**
	 * Optional label displayed above or alongside the input.
	 */
	label?: React.ReactNode;

	/**
	 * If true, appends an asterisk to indicate a required field.
	 */
	withAsterisk?: boolean;

	/**
	 * An object that allows customization of CSS class names for the input and its sections.
	 */
	classNames?: Partial<{
		input: string;
		leftSection: string;
		rightSection: string;
		label: string;
		description: string;
		error: string;
	}>;

	/**
	 * Optional mask pattern string for the input formatting.
	 *
	 * - `0`: Digit placeholder.
	 * - `A`: Letter placeholder.
	 * - `*`: Any character placeholder.
	 */
	mask?: string;

	/**
	 * Optional description displayed under the input, above the error.
	 */
	description?: React.ReactNode;
}

const applyMask = (value: string, mask: string) => {
	let result = "";
	let valueIndex = 0;
	for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
		const maskChar = mask[i];
		if (maskChar === "0") {
			// digit placeholder
			while (
				valueIndex < value.length &&
				!/\d/.test(value.charAt(valueIndex))
			) {
				valueIndex++;
			}
			if (valueIndex < value.length) {
				result += value.charAt(valueIndex);
				valueIndex++;
			}
		} else if (maskChar === "A") {
			// letter placeholder
			while (
				valueIndex < value.length &&
				!/[a-zA-Z]/.test(value.charAt(valueIndex))
			) {
				valueIndex++;
			}
			if (valueIndex < value.length) {
				result += value.charAt(valueIndex);
				valueIndex++;
			}
		} else if (maskChar === "*") {
			// any character placeholder
			result += value[valueIndex];
			valueIndex++;
		} else {
			// static mask character
			result += maskChar;
			if (value.charAt(valueIndex) === maskChar) {
				valueIndex++;
			}
		}
	}
	return result;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			leftSection,
			rightSection,
			classNames,
			label,
			id,
			error,
			withAsterisk,
			mask,
			description,
			onChange,
			value: propValue,
			...props
		},
		ref,
	) => {
		const autoId = React.useId();
		const inputId = id ?? autoId;
		const [internalValue, setInternalValue] = React.useState(
			typeof propValue === "string" ? propValue : "",
		);

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			let inputValue = event.target.value;
			if (mask) {
				inputValue = applyMask(inputValue, mask);
			}
			if (onChange) {
				// Create a synthetic event with masked value.
				const syntheticEvent = {
					...event,
					target: {
						...event.target,
						value: inputValue,
					},
				};
				onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
			}
			// If component is uncontrolled.
			if (propValue === undefined) {
				setInternalValue(inputValue);
			}
		};

		return (
			<div
				className={cn("relative w-full flex flex-col gap-2", className)}
			>
				<Label
					htmlFor={inputId}
					className={classNames?.label}
					withAsterisk={withAsterisk}
				>
					{label}
				</Label>
				<div className="relative">
					{leftSection && (
						<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
							{leftSection}
						</div>
					)}
					<input
						id={inputId}
						className={cn(
							`flex h-9 w-full rounded-md border bg-transparent ${
								leftSection ? "pl-10 pr-3" : "px-3"
							} py-1 text-base shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-primary/50 ${
								error
									? "border-destructive focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:shadow-[0_0_8px_0_hsl(var(--destructive)_/_0.2)]"
									: "border-input focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_8px_0_hsl(var(--primary)_/_0.15)]"
							}`,
							classNames?.input,
						)}
						ref={ref}
						onChange={handleChange}
						value={
							propValue !== undefined ? propValue : internalValue
						}
						{...props}
					/>
					{rightSection && (
						<div
							className={cn(
								"absolute right-3 bottom-0 transform text-muted-foreground",
								classNames?.rightSection,
							)}
						>
							{rightSection}
						</div>
					)}
				</div>
				<div className="flex flex-col">
					{description && (
						<p
							className={cn(
								"text-sm/3 text-muted-foreground",
								classNames?.description,
							)}
						>
							{description}
						</p>
					)}
					{error && (
						<p
							className={cn(
								"text-sm text-destructive",
								classNames?.error,
							)}
						>
							{error}
						</p>
					)}
				</div>
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input };
