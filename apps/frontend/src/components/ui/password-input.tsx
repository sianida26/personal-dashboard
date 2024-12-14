import * as React from "react";

import { cn } from "@/lib/utils";
import { Input, InputProps } from "./input";
import { TbEye, TbEyeClosed } from "react-icons/tb";

export interface PasswordInputProps extends InputProps {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	({ className, id, ...props }, ref) => {
		const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

		const togglePasswordVisibility = () => {
			setIsPasswordVisible((prev) => !prev);
		};

		return (
			<div className="relative w-full">
				<div className="relative">
					<Input
						id={id}
						className={cn(
							"pr-10", // Extra padding for the eye icon
							className
						)}
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
						ref={ref}
						{...props}
						type={isPasswordVisible ? "text" : "password"}
					/>
				</div>
			</div>
		);
	}
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
