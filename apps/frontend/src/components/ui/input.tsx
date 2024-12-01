import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
	leftSection?: React.ReactNode; // Custom prop that accepts ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, leftSection, ...props }, ref) => {
		return (
			<div className="relative w-full">
				{leftSection && (
					<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
						{leftSection}
					</div>
				)}
				<input
					type={type}
					className={cn(
						`flex h-9 w-full rounded-md border border-input bg-transparent ${leftSection ? "pl-10 pr-3" : "px-3"} py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,
						className
					)}
					ref={ref}
					{...props}
				/>
			</div>
		);
	}
);

Input.displayName = "Input";

export { Input };
