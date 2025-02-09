import * as React from "react";

import { cn } from "../utils";
import { TbEye, TbEyeClosed } from "react-icons/tb";
import { Input, type InputProps } from "./input";

export interface PasswordInputProps extends InputProps {
	isPasswordVisible?: boolean;
	onPasswordVisibilityChange?: (isVisible: boolean) => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	(
		{
			className,
			id,
			isPasswordVisible: controlledVisibility,
			onPasswordVisibilityChange,
			...props
		},
		ref,
	) => {
		const [internalVisibility, setInternalVisibility] =
			React.useState(false);

		const isPasswordVisible = controlledVisibility ?? internalVisibility;

		const togglePasswordVisibility = () => {
			const newValue = !isPasswordVisible;
			setInternalVisibility(newValue);
			onPasswordVisibilityChange?.(newValue);
		};

		return (
			<div className="relative w-full">
				<div className="relative">
					<Input
						type={isPasswordVisible ? "text" : "password"}
						id={id}
						className={cn("pr-10", className)}
						rightSection={
							<button
								type="button"
								onClick={togglePasswordVisibility}
								className=""
							>
								{isPasswordVisible ? (
									<TbEyeClosed className="w-5 h-5" />
								) : (
									<TbEye className="w-5 h-5" />
								)}
							</button>
						}
						{...props}
						ref={ref}
					/>
				</div>
			</div>
		);
	},
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
