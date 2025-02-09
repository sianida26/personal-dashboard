import { cn } from "../utils";
import * as React from "react";
import { Label } from "./label";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	withAsterisk?: boolean;
	classNames?: {
		textarea?: string;
	};
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, label, error, withAsterisk, classNames, ...props }, ref) => {
		return (
			<div className={cn("relative w-full", className)}>
				{label && (
					<span>
						<Label htmlFor={props.id} className="">
							{label}
						</Label>
						{withAsterisk && (
							<span className="text-red-500">*</span>
						)}
					</span>
				)}
				<textarea
					className={cn(
						"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						classNames?.textarea,
					)}
					ref={ref}
					{...props}
				/>

				{/* Error message */}
				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
		);
	},
);

Textarea.displayName = "Textarea";

export { Textarea };
