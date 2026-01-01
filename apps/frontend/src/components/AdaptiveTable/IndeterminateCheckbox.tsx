import { Checkbox } from "@repo/ui";
import type { HTMLProps } from "react";

// IndeterminateCheckbox component for row selection
// Adapts HTML input props to @repo/ui Checkbox (Shadcn/Radix)
export function IndeterminateCheckbox({
	indeterminate,
	className = "",
	...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
	return (
		<Checkbox
			className={className}
			// Radix UI Checkbox supports 'indeterminate' state
			checked={indeterminate ? "indeterminate" : rest.checked} // @ts-ignore - checked type mismatch is common with React Table
			onCheckedChange={(checked) => {
				if (rest.onChange) {
					// Adapter to match React's ChangeEvent<HTMLInputElement> expected by React Table
					rest.onChange({
						target: {
							checked: checked === true,
						},
					} as any);
				}
			}}
			disabled={rest.disabled}
		/>
	);
}

export default IndeterminateCheckbox;
