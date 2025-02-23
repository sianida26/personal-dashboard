import * as LabelPrimitive from "@radix-ui/react-label";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "../utils";

const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
	VariantProps<typeof labelVariants> & {
		withAsterisk?: boolean;
		showEmpty?: boolean; // when true, render even if children is empty
	};

const Label = React.forwardRef<
	React.ComponentRef<typeof LabelPrimitive.Root>,
	LabelProps
>(({ className, withAsterisk, children, showEmpty, ...props }, ref) => {
	if (!children && !showEmpty) {
		return null;
	}

	return (
		<LabelPrimitive.Root
			ref={ref}
			className={cn(labelVariants(), className)}
			{...props}
		>
			{children}
			{withAsterisk && <span className="text-red-500">*</span>}
		</LabelPrimitive.Root>
	);
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
