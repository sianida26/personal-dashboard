import * as React from "react";
import { cn } from "../utils";
import { Button } from "./button";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";

export interface CopyButtonProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
	/**
	 * Value that will be copied to clipboard when the button is clicked
	 */
	value: string;

	/**
	 * Time in ms after which copied state will be reset to false
	 * @default 2000
	 */
	timeout?: number;

	/**
	 * Function that receives current status and copy function
	 */
	children: (data: { copied: boolean; copy: () => void }) => React.ReactNode;
}

/**
 * CopyButton component for copying text to clipboard
 *
 * Renders a button or any other element that copies given text to clipboard
 */
function CopyButton({
	value,
	timeout = 2000,
	children,
	className,
	...props
}: CopyButtonProps) {
	const [copied, setCopied] = React.useState(false);
	const resetRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleCopy = React.useCallback(async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);

			if (resetRef.current) {
				clearTimeout(resetRef.current);
			}

			resetRef.current = setTimeout(() => {
				setCopied(false);
			}, timeout);
		} catch (error) {
			console.error("Failed to copy text: ", error);
		}
	}, [value, timeout]);

	React.useEffect(() => {
		return () => {
			if (resetRef.current) {
				clearTimeout(resetRef.current);
			}
		};
	}, []);

	return (
		<div className={cn("inline-flex", className)} {...props}>
			{children({ copied, copy: handleCopy })}
		</div>
	);
}

/**
 * A pre-configured CopyButton with a default button UI
 */
interface CopyButtonWithIconProps
	extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
	value: string;
	timeout?: number;
	copyLabel?: string;
	copiedLabel?: string;
}

function CopyButtonWithIcon({
	value,
	timeout,
	copyLabel = "Copy",
	copiedLabel = "Copied!",
	...buttonProps
}: CopyButtonWithIconProps) {
	return (
		<CopyButton value={value} timeout={timeout}>
			{({ copied, copy }) => (
				<Button
					size="sm"
					variant="outline"
					onClick={copy}
					{...buttonProps}
				>
					{copied ? (
						<>
							<CheckIcon className="mr-2 h-4 w-4" />
							{copiedLabel}
						</>
					) : (
						<>
							<CopyIcon className="mr-2 h-4 w-4" />
							{copyLabel}
						</>
					)}
				</Button>
			)}
		</CopyButton>
	);
}

export { CopyButton, CopyButtonWithIcon };
