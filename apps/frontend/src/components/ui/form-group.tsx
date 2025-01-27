import { cn } from "@/lib/utils";
import type React from "react";
import { forwardRef } from "react";

export type FormGroupProps = {
	legend?: React.ReactNode;
	classNames?: Partial<{
		legend: string;
	}>;
} & React.ComponentProps<"fieldset">;

const FormGroup = forwardRef<HTMLFieldSetElement, FormGroupProps>(
	({ children, className, classNames, legend, ...props }, ref) => {
		return (
			<fieldset
				ref={ref}
				className={cn(
					"flex flex-col gap-2 border p-4 rounded-md",
					className,
				)}
				{...props}
			>
				<legend className={cn("text-sm", classNames?.legend)}>
					{legend}
				</legend>
				{children}
			</fieldset>
		);
	},
);

FormGroup.displayName = "FormGroup";

export default FormGroup;
