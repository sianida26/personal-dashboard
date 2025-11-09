import { type HTMLProps, useEffect, useRef } from "react";

// IndeterminateCheckbox component for row selection
export function IndeterminateCheckbox({
	indeterminate,
	className = "",
	...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (typeof indeterminate === "boolean" && ref.current) {
			ref.current.indeterminate = !rest.checked && indeterminate;
		}
	}, [ref, indeterminate, rest.checked]);

	return (
		<input
			type="checkbox"
			ref={ref}
			className={`cursor-pointer ${className}`}
			{...rest}
		/>
	);
}

export default IndeterminateCheckbox;
