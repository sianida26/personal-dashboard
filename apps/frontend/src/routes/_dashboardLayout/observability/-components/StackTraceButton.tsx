import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
} from "@repo/ui";
import { TbCode, TbAlertTriangle, TbCopy, TbCheck } from "react-icons/tb";
import { formatUTCTimestamp, type StackTraceButtonProps } from "./utils";

export function StackTraceButton({
	stackTrace,
	errorMessage,
	eventType,
	endpoint,
	timestamp,
}: StackTraceButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(stackTrace);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy stack trace:", err);
		}
	};

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className="text-blue-600 hover:text-blue-800 h-auto p-1"
				onClick={() => setIsOpen(true)}
			>
				<TbCode className="h-4 w-4 mr-1" />
				View Stack Trace
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
					<DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
						<DialogTitle className="flex items-center gap-2">
							<TbAlertTriangle className="h-5 w-5 text-red-500" />
							Error Details
						</DialogTitle>
					</DialogHeader>

					<div className="flex-1 overflow-auto px-6 pb-6">
						<div className="space-y-6">
							{/* Error Summary */}
							<div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
								<div>
									<span className="text-sm font-medium text-muted-foreground">
										Event Type
									</span>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-sm font-semibold">
											{eventType
												.replace("_", " ")
												.toUpperCase()}
										</span>
									</div>
								</div>
								<div>
									<span className="text-sm font-medium text-muted-foreground">
										Endpoint
									</span>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-sm font-mono">
											{endpoint}
										</span>
									</div>
								</div>
								<div>
									<span className="text-sm font-medium text-muted-foreground">
										Timestamp
									</span>
									<p className="text-sm font-mono mt-1">
										{formatUTCTimestamp(timestamp)}
									</p>
								</div>
								<div>
									<span className="text-sm font-medium text-muted-foreground">
										Error Message
									</span>
									<p className="text-sm font-mono mt-1">
										{errorMessage || "No error message"}
									</p>
								</div>
							</div>

							{/* Stack Trace */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold">
										Stack Trace
									</h3>
									<Button
										size="sm"
										variant="outline"
										onClick={copyToClipboard}
										className="flex items-center gap-2"
									>
										{copied ? (
											<TbCheck className="h-4 w-4" />
										) : (
											<TbCopy className="h-4 w-4" />
										)}
										{copied ? "Copied!" : "Copy All"}
									</Button>
								</div>

								<div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-96">
									<ScrollArea className="h-full">
										{stackTrace
											.split("\n")
											.map((line, index) => {
												const lineId = `${index}-${line.substring(0, 20)}`;
												const isMainError =
													line.includes("Error:") ||
													line.includes(
														"TypeError:",
													) ||
													line.includes(
														"ReferenceError:",
													);
												const isFileReference =
													line.includes("(") &&
													line.includes(":");

												return (
													<div
														key={lineId}
														className={`text-sm ${
															isMainError
																? "font-semibold text-red-400 bg-red-900/20 p-2 rounded"
																: isFileReference
																	? "font-mono text-blue-400 hover:bg-blue-900/20 p-1 rounded cursor-pointer"
																	: "text-slate-300 pl-4"
														}`}
													>
														{line.trim()}
													</div>
												);
											})}
									</ScrollArea>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
