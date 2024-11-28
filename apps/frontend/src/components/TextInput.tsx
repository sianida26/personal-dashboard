import React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string | React.ReactNode;
	description?: string | React.ReactNode;
	wrapperClassName?: string;
};

export default function TextInput(props: Props) {
	return (
		<div className={`flex flex-col gap-2 ${props.wrapperClassName || ""}`}>
			{/* Label */}
			{props.label && <Label>{props.label}</Label>}

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
