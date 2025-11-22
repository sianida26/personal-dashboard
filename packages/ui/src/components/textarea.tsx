import { cn } from "../utils";
import * as React from "react";
import { Label } from "./label";

export interface TextareaProps
	extends Omit<
		React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		"value" | "onChange"
	> {
	/** The value of the textarea */
	value?: string;
	/** Callback fired when the value changes */
	onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	/** Callback fired when the textarea receives focus */
	onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	/** Callback fired when the textarea loses focus */
	onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	/** The label text for the textarea */
	label?: React.ReactNode;
	/** Error message to display below the textarea */
	error?: React.ReactNode;
	/** Whether to show an asterisk (*) next to the label */
	withAsterisk?: boolean;
	/** Custom class names for styling */
	classNames?: {
		textarea?: string;
		label?: string;
	};
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, label, error, withAsterisk, classNames, ...props }, ref) => {
		return (
			<div className={cn("relative w-full", className)}>
				{label && (
					<Label
						withAsterisk={withAsterisk}
						htmlFor={props.id}
						className={classNames?.label}
					>
						{label}
					</Label>
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
