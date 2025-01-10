import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";
import { useId } from "react";

export type CheckboxProps = React.ComponentPropsWithoutRef<
	typeof CheckboxPrimitive.Root
> & {
	label?: string;
	classNames?: Partial<{
		root: string;
		checkbox: string;
		label: string;
	}>;
	value?: boolean;
	onChange?: (value: boolean) => void;
};

const Checkbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	CheckboxProps
>(({ className, classNames, id, ...props }, ref) => {
	const generatedId = useId();
	const checkboxId = id || generatedId;

	return (
		<div
			className={cn(
				"flex items-center gap-2",
				className,
				classNames?.root
			)}
		>
			<CheckboxPrimitive.Root
				ref={ref}
				id={checkboxId}
				className={cn(
					"peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
					classNames?.checkbox
				)}
				onCheckedChange={(e) => {
					props.onChange?.(e.valueOf() as boolean);
				}}
				{...props}
			>
				<CheckboxPrimitive.Indicator
					className={cn(
						"flex items-center justify-center text-current"
					)}
				>
					<CheckIcon className="h-4 w-4" />
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>
			{props.label && (
				<label
					htmlFor={checkboxId}
					className={cn("text-sm select-none", classNames?.label)}
				>
					{props.label}
				</label>
			)}
		</div>
	);
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
