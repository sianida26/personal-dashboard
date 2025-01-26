import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

export interface InputProps extends React.ComponentProps<"input"> {
	error?: string;
	leftSection?: React.ReactNode; // Custom prop that accepts ReactNode
	rightSection?: React.ReactNode; // Custom prop that accepts ReactNode
	label?: React.ReactNode; // Custom prop for the label
	withAsterisk?: boolean;
	classNames?: Partial<{
		rightSection: string;
	}>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			leftSection,
			rightSection,
			classNames,
			label,
			id,
			error,
			withAsterisk,
			...props
		},
		ref,
	) => {
		return (
			<div className="relative w-full	">
				{label && (
					<span>
						<Label htmlFor={id} className="">
							{label}
						</Label>
						{withAsterisk && <span className="text-red-500">*</span>}
					</span>
				)}
				<div className="relative">
					{leftSection && (
						<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
							{leftSection}
						</div>
					)}
					<input
						id={id} // Ensures the label works correctly
						type={type}
						className={cn(
							`flex h-9 w-full rounded-md border bg-transparent ${leftSection ? "pl-10 pr-3" : "px-3"} py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${error ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-ring"}`,
							className,
						)}
						ref={ref}
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

				<p className="text-sm text-destructive">{error}</p>
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input };
