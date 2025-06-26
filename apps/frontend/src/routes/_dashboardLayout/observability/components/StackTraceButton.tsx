import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Badge,
} from "@repo/ui";
import { TbCode, TbAlertTriangle, TbCopy, TbCheck } from "react-icons/tb";
import { formatUTCTimestamp } from "../utils";

interface StackTraceButtonProps {
	stackTrace: string;
	errorMessage: string;
	eventType: string;
	endpoint: string;
	timestamp: string;
}

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
										Error Source
									</span>
									<div className="flex items-center gap-2 mt-1">
										<Badge
											variant={
												eventType === "frontend_error"
													? "destructive"
													: "secondary"
											}
										>
											{eventType === "frontend_error"
												? "Frontend"
												: "Backend API"}
										</Badge>
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
								<div className="col-span-2">
									<span className="text-sm font-medium text-muted-foreground">
										Endpoint/Route
									</span>
									<p className="text-sm font-mono bg-background px-2 py-1 rounded border mt-1">
										{endpoint}
									</p>
								</div>
								<div className="col-span-2">
									<span className="text-sm font-medium text-muted-foreground">
										Error Message
									</span>
									<p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border mt-1 break-words">
										{errorMessage}
									</p>
								</div>
							</div>

							{/* Divider */}
							<div className="border-t border-border"></div>

							{/* Stack Trace */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">
										Raw Stack Trace
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={copyToClipboard}
										className="h-8 text-xs"
									>
										{copied ? (
											<>
												<TbCheck className="h-3 w-3 mr-1" />
												Copied
											</>
										) : (
											<>
												<TbCopy className="h-3 w-3 mr-1" />
												Copy
											</>
										)}
									</Button>
								</div>
								<ScrollArea className="h-64 w-full border rounded-md bg-background">
									<pre className="text-xs p-4 font-mono whitespace-pre-wrap">
										{stackTrace}
									</pre>
								</ScrollArea>
							</div>

							{/* Parsed Stack Trace for better readability */}
							<div className="space-y-4">
								<span className="text-sm font-medium text-muted-foreground">
									Parsed Stack Trace
								</span>
								<div className="max-h-64 overflow-y-auto border rounded-md bg-background">
									<div className="p-3 space-y-2">
										{stackTrace
											.split("\n")
											.filter((line) => line.trim())
											.map((line) => {
												const lineId = `${line.substring(0, 20)}-${Math.random().toString(36).substr(2, 9)}`;
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
																? "font-semibold text-red-600 bg-red-50 p-2 rounded"
																: isFileReference
																	? "font-mono text-blue-600 hover:bg-blue-50 p-1 rounded cursor-pointer"
																	: "text-muted-foreground pl-4"
														}`}
													>
														{line.trim()}
													</div>
												);
											})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
