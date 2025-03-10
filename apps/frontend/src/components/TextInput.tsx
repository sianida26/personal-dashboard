import type React from "react";
import { Input } from "@repo/ui";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string | React.ReactNode;
	description?: string | React.ReactNode;
	wrapperClassName?: string;
};

export default function TextInput(props: Props) {
	return (
		<div className={`flex flex-col gap-2 ${props.wrapperClassName || ""}`}>
			<Input {...props} />

			{/* Description */}
			{props.description && typeof props.description === "string" ? (
				<p>{props.description}</p>
			) : (
				props.description
			)}
		</div>
	);
}
