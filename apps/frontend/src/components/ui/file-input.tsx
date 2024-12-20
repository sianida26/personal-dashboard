import * as React from "react";

import { Input, InputProps } from "./input";

export interface FileInputProps extends InputProps {}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
	({ ...props }, ref) => {
		return (
			<div className="relative w-full">
				<div className="relative">
					<Input ref={ref} {...props} type="file" />
				</div>
			</div>
		);
	}
);

FileInput.displayName = "FileInput";

export { FileInput };
