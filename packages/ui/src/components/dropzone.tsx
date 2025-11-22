import * as React from "react";
import { cn } from "../utils";
import { Label } from "./label";

export interface DropzoneProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "onDrop"> {
	/**
	 * Main component className
	 */
	className?: string;

	/**
	 * Children to be rendered inside the dropzone
	 */
	children: React.ReactNode;

	/**
	 * An object to customize classNames for different parts of the component
	 */
	classNames?: Partial<{
		root: string;
		inner: string;
		active: string;
		idle: string;
		accept: string;
		reject: string;
		loading: string;
		label: string;
		description: string;
		error: string;
	}>;

	/**
	 * Maximum file size in bytes
	 */
	maxSize?: number;

	/**
	 * Function to handle accepted files
	 */
	onDrop?: (files: File[]) => void;

	/**
	 * Function to handle rejected files
	 */
	onReject?: (files: { file: File; errors: Error[] }[]) => void;

	/**
	 * Accept only specific file types
	 * Can be a string of comma-separated mime types or an object mapping mime types to file extensions
	 */
	accept?: string | string[] | Record<string, string[]>;

	/**
	 * Disable the dropzone
	 */
	disabled?: boolean;

	/**
	 * Whether to open file browser when the dropzone is clicked
	 */
	activateOnClick?: boolean;

	/**
	 * Show loading overlay and disable the dropzone
	 */
	loading?: boolean;

	/**
	 * Multiple file selection
	 */
	multiple?: boolean;

	/**
	 * Reference to open file browser programmatically
	 */
	openRef?: React.MutableRefObject<(() => void) | null>;

	/**
	 * Optional label displayed above the dropzone
	 */
	label?: React.ReactNode;

	/**
	 * If true, adds an asterisk to the label to indicate required field
	 */
	withAsterisk?: boolean;

	/**
	 * Optional description displayed below the dropzone
	 */
	description?: React.ReactNode;

	/**
	 * Optional error message displayed below the dropzone
	 */
	error?: React.ReactNode;

	/**
	 * ID for the dropzone input element
	 */
	id?: string;
}

export const IMAGE_MIME_TYPE = [
	"image/png",
	"image/gif",
	"image/jpeg",
	"image/svg+xml",
	"image/webp",
	"image/avif",
	"image/heic",
	"image/heif",
];

export const PDF_MIME_TYPE = ["application/pdf"];
export const MS_WORD_MIME_TYPE = [
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const MS_EXCEL_MIME_TYPE = [
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const MS_POWERPOINT_MIME_TYPE = [
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const MIME_TYPES = {
	png: "image/png",
	gif: "image/gif",
	jpeg: "image/jpeg",
	svg: "image/svg+xml",
	webp: "image/webp",
	avif: "image/avif",
	heic: "image/heic",
	heif: "image/heif",
	mp4: "video/mp4",
	zip: "application/zip",
	rar: "application/x-rar",
	"7z": "application/x-7z-compressed",
	csv: "text/csv",
	pdf: "application/pdf",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	ppt: "application/vnd.ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	exe: "application/vnd.microsoft.portable-executable",
};

export interface FileWithPath extends File {
	path?: string;
}

type DropzoneStatus = "accept" | "reject" | "idle";

const DropzoneContext = React.createContext<{ status: DropzoneStatus }>({
	status: "idle",
});

// Define accept, reject, idle component types
type DropzoneAcceptProps = {
	children: React.ReactNode;
	className?: string;
};

type DropzoneRejectProps = {
	children: React.ReactNode;
	className?: string;
};

type DropzoneIdleProps = {
	children: React.ReactNode;
	className?: string;
};

type DropzoneFullScreenProps = DropzoneProps & { active: boolean };

const DropzoneAccept: React.FC<DropzoneAcceptProps> = ({
	children,
	className,
}) => {
	const { status } = React.useContext(DropzoneContext);
	if (status !== "accept") return null;
	return <div className={className}>{children}</div>;
};

const DropzoneReject: React.FC<DropzoneRejectProps> = ({
	children,
	className,
}) => {
	const { status } = React.useContext(DropzoneContext);
	if (status !== "reject") return null;
	return <div className={className}>{children}</div>;
};

const DropzoneIdle: React.FC<DropzoneIdleProps> = ({ children, className }) => {
	const { status } = React.useContext(DropzoneContext);
	if (status !== "idle") return null;
	return <div className={className}>{children}</div>;
};

// Full screen dropzone component
const DropzoneFullScreen: React.FC<DropzoneFullScreenProps> = ({
	active,
	children,
	onDrop,
	onReject,
	className,
	classNames,
	accept,
	maxSize,
	multiple = true,
}) => {
	if (!active) return null;

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4",
				classNames?.root,
				className,
			)}
		>
			<Dropzone
				className={cn(
					"bg-white max-w-xl w-full mx-auto",
					classNames?.inner,
				)}
				onDrop={onDrop}
				onReject={onReject}
				accept={accept}
				maxSize={maxSize}
				multiple={multiple}
			>
				{children}
			</Dropzone>
		</div>
	);
};

const DropzoneComponent = React.forwardRef<HTMLDivElement, DropzoneProps>(
	(
		{
			children,
			className,
			classNames,
			accept,
			disabled = false,
			activateOnClick = true,
			loading = false,
			maxSize,
			multiple = true,
			onDrop,
			onReject,
			openRef,
			label,
			withAsterisk,
			description,
			error,
			id,
			...props
		},
		ref,
	) => {
		const inputRef = React.useRef<HTMLInputElement>(null);
		const [status, setStatus] = React.useState<DropzoneStatus>("idle");
		const dragCounterRef = React.useRef(0);
		const autoId = React.useId();
		const dropzoneId = id ?? autoId;

		// Process accept parameter to match react-dropzone requirements
		const acceptMimeTypes = React.useMemo(() => {
			if (!accept) return undefined;

			if (typeof accept === "string") {
				const result: Record<string, string[]> = {};
				for (const val of accept.split(",")) {
					result[val.trim()] = [];
				}
				return result;
			}

			if (Array.isArray(accept)) {
				const result: Record<string, string[]> = {};
				for (const val of accept) {
					result[val.trim()] = [];
				}
				return result;
			}

			return accept;
		}, [accept]);

		const openFileBrowser = () => {
			if (!loading && !disabled && inputRef.current) {
				inputRef.current.click();
			}
		};

		// Expose open function through ref
		React.useEffect(() => {
			if (openRef) {
				openRef.current = openFileBrowser;
			}
		}, [openRef]);

		// Handle file selection
		const handleFileSelect = (
			event: React.ChangeEvent<HTMLInputElement>,
		) => {
			if (event.target.files && event.target.files.length > 0) {
				const files = Array.from(event.target.files) as FileWithPath[];
				processFiles(files);
			}
			// Reset input value to allow selecting the same file again
			if (inputRef.current) inputRef.current.value = "";
		};

		// Validate files
		const validateFiles = (files: FileWithPath[]) => {
			const acceptedFiles: FileWithPath[] = [];
			const rejectedFiles: { file: FileWithPath; errors: Error[] }[] = [];

			for (const file of files) {
				const errors: Error[] = [];

				// Check file size
				if (maxSize && file.size > maxSize) {
					errors.push(
						new Error(`File size exceeds ${maxSize} bytes`),
					);
				}

				// Check file type
				if (acceptMimeTypes) {
					const fileType = file.type || "";
					const fileExtension =
						file.name.split(".").pop()?.toLowerCase() || "";
					let accepted = false;

					for (const [
						mimeTypeOrExtKey,
						associatedExtensions,
					] of Object.entries(acceptMimeTypes)) {
						// If mime type matches directly
						if (fileType === mimeTypeOrExtKey) {
							accepted = true;
							break;
						}

						// If mime type pattern matches (e.g., image/*)
						if (
							mimeTypeOrExtKey.endsWith("/*") &&
							fileType.startsWith(
								mimeTypeOrExtKey.replace("/*", ""),
							)
						) {
							accepted = true;
							break;
						}

						// If extension matches within associated extensions array
						const requiredExtensions = associatedExtensions.map(
							(ext) =>
								ext.toLowerCase().startsWith(".")
									? ext.toLowerCase()
									: `.${ext.toLowerCase()}`,
						);
						if (requiredExtensions.includes(`.${fileExtension}`)) {
							accepted = true;
							break;
						}

						// --- ADDED CHECK --- Check if the key itself is the required extension
						if (
							mimeTypeOrExtKey.startsWith(".") &&
							mimeTypeOrExtKey === `.${fileExtension}`
						) {
							accepted = true;
							break;
						}
					}

					if (!accepted) {
						errors.push(new Error("File type not accepted"));
					}
				}

				if (errors.length > 0) {
					rejectedFiles.push({ file, errors });
				} else {
					acceptedFiles.push(file);
				}
			}
			return { acceptedFiles, rejectedFiles };
		};

		// Process dropped or selected files
		const processFiles = (files: FileWithPath[]) => {
			if (disabled || loading) return;

			const { acceptedFiles, rejectedFiles } = validateFiles(files);

			if (acceptedFiles.length > 0 && onDrop) {
				onDrop(acceptedFiles);
			}

			if (rejectedFiles.length > 0 && onReject) {
				onReject(rejectedFiles);
			}
		};

		// Handle drag events
		const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();
		};

		const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();
			dragCounterRef.current += 1;

			if (disabled || loading) return;

			if (event.dataTransfer) {
				try {
					const items = Array.from(event.dataTransfer.items);
					const hasAcceptedFiles = items.some((item) => {
						if (item.kind !== "file") return false;

						// Basic check - more detailed validation happens on drop
						if (!acceptMimeTypes) return true;

						const fileType = item.type;
						return Object.keys(acceptMimeTypes).some((mimeType) => {
							if (mimeType.endsWith("/*")) {
								return fileType.startsWith(
									mimeType.replace("/*", ""),
								);
							}
							return fileType === mimeType;
						});
					});

					setStatus(hasAcceptedFiles ? "accept" : "reject");
				} catch (error) {
					console.error(error);
					//TODO: Add error handling
					setStatus("reject");
				}
			}
		};

		const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();

			dragCounterRef.current -= 1;
			if (dragCounterRef.current === 0) {
				setStatus("idle");
			}
		};

		const handleDropEvent = (event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();
			dragCounterRef.current = 0;
			setStatus("idle");

			if (disabled || loading) return;

			if (event.dataTransfer) {
				const files = Array.from(
					event.dataTransfer.files,
				) as FileWithPath[];
				processFiles(files);
			}
		};

		const isDisabled = disabled || loading;

		const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
			if (
				activateOnClick &&
				!isDisabled &&
				(event.key === "Enter" || event.key === " ")
			) {
				event.preventDefault();
				openFileBrowser();
			}
		};

		return (
			<div className="w-full flex flex-col gap-2">
				{label && (
					<Label
						htmlFor={dropzoneId}
						withAsterisk={withAsterisk}
						className={cn(classNames?.label)}
					>
						{label}
					</Label>
				)}
				<DropzoneContext.Provider value={{ status }}>
					{/* biome-ignore lint/a11y/useSemanticElements: <button> might break styling for this large dropzone area */}
					<div
						ref={ref}
						id={dropzoneId}
						className={cn(
							"relative border-2 border-dashed border-gray-300 rounded-md p-6 transition-colors",
							status === "accept" &&
								"border-green-500 bg-green-50",
							status === "reject" && "border-red-500 bg-red-50",
							error && "border-destructive",
							isDisabled && "opacity-50 cursor-not-allowed",
							classNames?.root,
							className,
						)}
						data-loading={loading || undefined}
						data-accept={status === "accept" || undefined}
						data-reject={status === "reject" || undefined}
						data-idle={status === "idle" || undefined}
						role="button"
						tabIndex={isDisabled ? -1 : 0}
						onKeyDown={handleKeyDown}
						onClick={
							activateOnClick && !isDisabled
								? openFileBrowser
								: undefined
						}
						onDragOver={handleDragOver}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDrop={handleDropEvent}
						{...props}
					>
						<div
							className={cn(
								"pointer-events-none",
								classNames?.inner,
							)}
						>
							{children}
						</div>

						{loading && (
							<div
								className={cn(
									"absolute inset-0 flex items-center justify-center bg-white/70 rounded-md",
									classNames?.loading,
								)}
							>
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
							</div>
						)}

						<input
							ref={inputRef}
							type="file"
							className="hidden"
							accept={
								Array.isArray(accept)
									? accept.join(",")
									: typeof accept === "string"
										? accept
										: undefined
							}
							multiple={multiple}
							onChange={handleFileSelect}
							disabled={isDisabled}
						/>
					</div>
				</DropzoneContext.Provider>

				{description && !error && (
					<p
						className={cn(
							"text-sm text-muted-foreground",
							classNames?.description,
						)}
					>
						{description}
					</p>
				)}

				{error && (
					<p
						className={cn(
							"text-sm font-medium text-destructive",
							classNames?.error,
						)}
					>
						{error}
					</p>
				)}
			</div>
		);
	},
);

DropzoneComponent.displayName = "Dropzone";

// Add components as properties
interface DropzoneType
	extends React.ForwardRefExoticComponent<
		DropzoneProps & React.RefAttributes<HTMLDivElement>
	> {
	Accept: typeof DropzoneAccept;
	Reject: typeof DropzoneReject;
	Idle: typeof DropzoneIdle;
	FullScreen: typeof DropzoneFullScreen;
}

// Cast the component to include its sub-components
export const Dropzone = DropzoneComponent as DropzoneType;
Dropzone.Accept = DropzoneAccept;
Dropzone.Reject = DropzoneReject;
Dropzone.Idle = DropzoneIdle;
Dropzone.FullScreen = DropzoneFullScreen;

export default Dropzone;
