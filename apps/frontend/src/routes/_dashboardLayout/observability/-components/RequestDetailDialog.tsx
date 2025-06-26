import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Badge,
	Button,
	ScrollArea,
} from "@repo/ui";
import {
	TbAlertTriangle,
	TbList,
	TbCode,
	TbExternalLink,
	TbActivity,
	TbCopy,
	TbCheck,
} from "react-icons/tb";
import client from "@/honoClient";
import {
	formatUTCTime,
	getMethodVariant,
	getStatusCodeVariant,
	type RequestDetailDialogProps,
} from "./utils";

export function RequestDetailDialog({
	requestId,
	isOpen,
	onClose,
}: RequestDetailDialogProps) {
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const {
		data: requestDetail,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["observability", "request-detail", requestId],
		queryFn: async () => {
			const response = await client.observability.requests[":id"].$get({
				param: { id: requestId },
			});
			if (!response.ok) {
				throw new Error("Failed to fetch request details");
			}
			return response.json();
		},
		enabled: isOpen && !!requestId,
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000, // 5 minutes
	});

	const copyToClipboard = async (text: string, fieldName: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldName);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopiedField(fieldName);
			setTimeout(() => setCopiedField(null), 2000);
		}
	};

	const formatJson = (data: unknown): string => {
		if (!data) return "null";
		return JSON.stringify(data, null, 2);
	};

	const renderJsonContent = (
		content: unknown,
		title: string,
		fieldKey: string,
	) => {
		const jsonString = formatJson(content);
		const hasContent = content !== null && content !== undefined;

		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-medium text-foreground">
						{title}
					</h4>
					{hasContent && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								copyToClipboard(jsonString, fieldKey)
							}
							className="h-6 px-2"
						>
							{copiedField === fieldKey ? (
								<TbCheck className="h-3 w-3" />
							) : (
								<TbCopy className="h-3 w-3" />
							)}
							{copiedField === fieldKey ? "Copied!" : "Copy"}
						</Button>
					)}
				</div>
				<div className="relative border rounded-md bg-muted/50 resize-y min-h-[200px] max-h-[600px] h-80 overflow-hidden">
					<ScrollArea className="h-full p-3">
						<pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
							{jsonString}
						</pre>
					</ScrollArea>
				</div>
			</div>
		);
	};

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
				<DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
					<DialogTitle>Request Details</DialogTitle>
				</DialogHeader>

				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				)}

				{error && (
					<div className="flex-shrink-0 px-6">
						<Card className="bg-red-50 border-red-200">
							<CardContent className="pt-6">
								<div className="flex items-start space-x-3">
									<TbAlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
									<div>
										<h4 className="text-sm font-medium text-red-900">
											Error Loading Request Details
										</h4>
										<p className="text-sm text-red-700 mt-1">
											Unable to load request details.
											Please try again.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{requestDetail?.data && (
					<div className="flex-1 overflow-auto px-6 pb-6">
						<div className="space-y-6">
							{/* Request Overview */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										<TbList className="h-5 w-5" />
										Request Overview
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												Method & Endpoint
											</div>
											<div className="flex items-center gap-2 mt-1">
												<Badge
													variant={getMethodVariant(
														requestDetail.data
															.method,
													)}
												>
													{requestDetail.data.method}
												</Badge>
												<span className="font-mono text-sm">
													{
														requestDetail.data
															.endpoint
													}
												</span>
											</div>
										</div>
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												Request ID
											</div>
											<div className="font-mono text-sm mt-1">
												{requestDetail.data.requestId}
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												User
											</div>
											<div className="text-sm mt-1">
												{requestDetail.data.user
													?.name ||
													requestDetail.data.user
														?.email ||
													"Anonymous"}
											</div>
										</div>
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												IP Address
											</div>
											<div className="font-mono text-sm mt-1">
												{requestDetail.data.ipAddress ||
													"-"}
											</div>
										</div>
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												Timestamp
											</div>
											<div className="text-sm mt-1">
												{requestDetail.data.createdAt
													? new Date(
															requestDetail.data
																.createdAt,
														).toLocaleString()
													: "-"}
											</div>
										</div>
									</div>

									{requestDetail.data.userAgent && (
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												User Agent
											</div>
											<div className="text-sm mt-1 p-2 bg-muted rounded">
												{requestDetail.data.userAgent}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Request & Response Data */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Request Data */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<TbCode className="h-5 w-5" />
											Request Data
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{requestDetail.data.queryParams &&
											renderJsonContent(
												requestDetail.data.queryParams,
												"Query Parameters",
												"queryParams",
											)}

										{requestDetail.data.requestHeaders &&
											renderJsonContent(
												requestDetail.data
													.requestHeaders,
												"Request Headers",
												"requestHeaders",
											)}

										{requestDetail.data.requestBody &&
											renderJsonContent(
												requestDetail.data.requestBody,
												"Request Body",
												"requestBody",
											)}
									</CardContent>
								</Card>

								{/* Response Data */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<TbExternalLink className="h-5 w-5" />
											Response Data
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{requestDetail.data.responseHeaders &&
											renderJsonContent(
												requestDetail.data
													.responseHeaders,
												"Response Headers",
												"responseHeaders",
											)}

										{requestDetail.data.responseBody &&
											renderJsonContent(
												requestDetail.data.responseBody,
												"Response Body",
												"responseBody",
											)}
									</CardContent>
								</Card>
							</div>

							{/* Related Events */}
							{requestDetail.data.relatedEvents &&
								requestDetail.data.relatedEvents.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2">
												<TbActivity className="h-5 w-5" />
												Related Events (
												{
													requestDetail.data
														.relatedEvents.length
												}
												)
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{requestDetail.data.relatedEvents.map(
													(event, index) => (
														<div
															key={event.id}
															className="border rounded-lg p-3 space-y-2"
														>
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-2">
																	<Badge
																		variant={
																			event.eventType ===
																			"api_request"
																				? "default"
																				: event.eventType ===
																						"frontend_error"
																					? "destructive"
																					: "secondary"
																		}
																	>
																		{
																			event.eventType
																		}
																	</Badge>
																	{event.statusCode && (
																		<Badge
																			variant={getStatusCodeVariant(
																				event.statusCode,
																			)}
																		>
																			{
																				event.statusCode
																			}
																		</Badge>
																	)}
																	{event.responseTimeMs && (
																		<span className="text-sm text-muted-foreground">
																			{
																				event.responseTimeMs
																			}
																			ms
																		</span>
																	)}
																</div>
																<span className="text-xs text-muted-foreground">
																	{formatUTCTime(
																		event.timestamp,
																	)}
																</span>
															</div>

															{event.errorMessage && (
																<div>
																	<div className="text-sm font-medium text-red-900">
																		Error
																		Message:
																	</div>
																	<div className="text-sm text-red-700 bg-red-50 p-2 rounded mt-1">
																		{
																			event.errorMessage
																		}
																	</div>
																</div>
															)}

															{event.stackTrace && (
																<div>
																	<div className="flex items-center justify-between">
																		<div className="text-sm font-medium text-muted-foreground">
																			Stack
																			Trace:
																		</div>
																		<Button
																			size="sm"
																			variant="ghost"
																			onClick={() =>
																				copyToClipboard(
																					event.stackTrace ||
																						"",
																					`stackTrace-${index}`,
																				)
																			}
																			className="h-6 px-2"
																		>
																			{copiedField ===
																			`stackTrace-${index}` ? (
																				<TbCheck className="h-3 w-3" />
																			) : (
																				<TbCopy className="h-3 w-3" />
																			)}
																		</Button>
																	</div>
																	<ScrollArea className="h-32 w-full rounded-md border bg-muted/50 p-2 mt-1">
																		<pre className="text-xs font-mono whitespace-pre-wrap">
																			{
																				event.stackTrace
																			}
																		</pre>
																	</ScrollArea>
																</div>
															)}

															{event.metadata && (
																<div>
																	<div className="flex items-center justify-between">
																		<div className="text-sm font-medium text-muted-foreground">
																			Metadata:
																		</div>
																		<Button
																			size="sm"
																			variant="ghost"
																			onClick={() =>
																				copyToClipboard(
																					formatJson(
																						event.metadata,
																					),
																					`metadata-${index}`,
																				)
																			}
																			className="h-6 px-2"
																		>
																			{copiedField ===
																			`metadata-${index}` ? (
																				<TbCheck className="h-3 w-3" />
																			) : (
																				<TbCopy className="h-3 w-3" />
																			)}
																		</Button>
																	</div>
																	<ScrollArea className="h-24 w-full rounded-md border bg-muted/50 p-2 mt-1">
																		<pre className="text-xs font-mono whitespace-pre-wrap">
																			{formatJson(
																				event.metadata,
																			)}
																		</pre>
																	</ScrollArea>
																</div>
															)}
														</div>
													),
												)}
											</div>
										</CardContent>
									</Card>
								)}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
