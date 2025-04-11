import * as React from "react";
import { cn } from "../utils";
import { Input, type InputProps } from "./input";
import { TbX } from "react-icons/tb";

export interface FileInputProps extends Omit<InputProps, "value" | "onChange"> {
	/**
	 * Allow multiple file selection
	 */
	multiple?: boolean;

	/**
	 * Callback when file(s) are selected
	 */
	onChange?: (files: FileList | null) => void;

	/**
	 * Show selected file name(s)
	 * @default true
	 */
	showSelectedFiles?: boolean;

	/**
	 * Show clear button to reset selection
	 * @default true
	 */
	showClearButton?: boolean;

	/**
	 * Custom text to display when no file is selected
	 * @default "No file selected"
	 */
	noFileText?: string;

	/**
	 * Custom class for the file name display
	 */
	fileNameClassName?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
	(
		{
			className,
			multiple = false,
			onChange,
			showSelectedFiles = true,
			showClearButton = true,
			noFileText = "No file selected",
			fileNameClassName,
			...props
		},
		ref,
	) => {
		const [files, setFiles] = React.useState<FileList | null>(null);
		const inputRef = React.useRef<HTMLInputElement>(null);
		const combinedRef = useCombinedRefs(ref, inputRef);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newFiles = e.target.files;
			setFiles(newFiles);
			onChange?.(newFiles);
		};

		const handleClear = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (inputRef.current) {
				inputRef.current.value = "";
				setFiles(null);
				onChange?.(null);
			}
		};

		const getFileNames = () => {
			if (!files || files.length === 0) return noFileText;

			if (files.length === 1 && files[0]) return files[0].name;

			return `${files.length} files selected`;
		};

		return (
			<div className={cn("relative w-full", className)}>
				<div className="relative">
					<Input
						ref={combinedRef}
						type="file"
						multiple={multiple}
						onChange={handleChange}
						className={cn(
							"cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10",
						)}
						{...props}
					/>

					<div
						className={cn(
							"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer",
							props.disabled && "cursor-not-allowed opacity-50",
						)}
					>
						<div className="flex-1 flex items-center truncate">
							{showSelectedFiles && (
								<span
									className={cn(
										"truncate text-muted-foreground",
										fileNameClassName,
									)}
								>
									{getFileNames()}
								</span>
							)}
						</div>

						{showClearButton && files && files.length > 0 && (
							<button
								type="button"
								onClick={handleClear}
								className="ml-2 text-muted-foreground hover:text-foreground"
								disabled={props.disabled}
							>
								<TbX className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>
			</div>
		);
	},
);

// Helper function to combine refs
function useCombinedRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefObject<T | null> {
	const targetRef = React.useRef<T>(null);

	React.useEffect(() => {
		for (const ref of refs) {
			if (!ref) continue;

			if (typeof ref === "function") {
				ref(targetRef.current);
			} else {
				(ref as React.MutableRefObject<T | null>).current =
					targetRef.current;
			}
		}
	}, [refs]);

	return targetRef;
}

FileInput.displayName = "FileInput";

export { FileInput };
