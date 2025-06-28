import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Button } from "@repo/ui";
import {
	TbEye,
	TbArrowLeft,
	TbAlertTriangle,
	TbCode,
	TbList,
	TbCopy,
	TbCheck,
} from "react-icons/tb";
import {
	createPageTemplate,
	type QueryParams,
} from "@/components/PageTemplate";
import client from "@/honoClient";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
} from "@repo/ui";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useNavigate } from '@tanstack/react-router';

// Configure dayjs to use UTC
dayjs.extend(utc);

// Utility function for consistent UTC timestamp formatting
const formatUTCTimestamp = (timestamp: string | Date) => {
	return dayjs(timestamp).utc().format("DD/MM/YYYY HH:mm:ss [UTC]");
};

// Utility functions for consistent color coding
const getStatusCodeVariant = (statusCode: number) => {
	if (statusCode >= 200 && statusCode < 300) return "success"; // Green (success)
	if (statusCode >= 300 && statusCode < 400) return "redirect"; // Gray (redirect)
	if (statusCode >= 400 && statusCode < 500) return "clientError"; // Orange (client error)
	if (statusCode >= 500) return "serverError"; // Red (server error)
	return "outline";
};

const getResponseTimeColor = (responseTime: number) => {
	if (responseTime < 300) return "text-green-600"; // Green (fast)
	if (responseTime <= 1000) return "text-orange-500"; // Orange (moderate)
	return "text-red-600"; // Red (slow)
};

const getMethodVariant = (method: string) => {
	switch (method) {
		case "GET":
			return "methodGet"; // Blue
		case "POST":
			return "methodPost"; // Green
		case "PUT":
			return "methodPut"; // Orange
		case "DELETE":
			return "methodDelete"; // Red
		case "PATCH":
			return "methodPatch"; // Purple
		default:
			return "outline";
	}
};

// Request Detail Dialog Component for request exploration
interface RequestDetailDialogProps {
	requestId: string;
	isOpen: boolean;
	onClose: () => void;
}

function RequestDetailDialog({
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
			})
			if (!response.ok) {
				throw new Error("Failed to fetch request details");
			}
			return response.json();
		},
		enabled: isOpen && !!requestId,
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000, // 5 minutes
	})

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
	}

	const formatJson = (data: unknown): string => {
		if (!data) return "null";
		return JSON.stringify(data, null, 2);
	}

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
		)
	}

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
												requestDetail.data.requestHeaders,
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
											<TbCode className="h-5 w-5" />
											Response Data
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{requestDetail.data.responseHeaders &&
											renderJsonContent(
												requestDetail.data.responseHeaders,
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
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}

function EndpointRequestsTable() {
	const navigate = useNavigate();
	const { endpoint, method } = useSearch({ from: '/_dashboardLayout/observability/endpoint-requests' });
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

	// Create a wrapper endpoint that includes the filters
	const filteredEndpoint = async (args: Record<string, unknown> & { query: QueryParams }) => {
		// Add routePath and method filters to the query
		// Use routePath instead of endpoint since we're filtering by route pattern
		const filteredQuery = {
			...args.query,
			routePath: endpoint, // endpoint from search params is actually the routePath
			method,
		};
		
		return client.observability.requests.$get({
			query: filteredQuery,
		});
	};

	// Create the table component with endpoint and method filters pre-applied
	const tableComponent = createPageTemplate({
		title: `Requests for ${method} ${endpoint}`,
		endpoint: filteredEndpoint,
		queryKey: ["observability", "requests", endpoint, method],
		createButton: false,
		sortableColumns: ["createdAt", "endpoint", "method"],
		filterableColumns: [],
		columnBorders: true,
		columnDefs: (helper) => [
			helper.display({
				header: "#",
				cell: (props) =>
					props.table.getState().pagination.pageIndex *
						props.table.getState().pagination.pageSize +
					props.row.index +
					1,
			}),
			helper.display({
				header: "Actions",
				cell: (props) => {
					const row = props.row.original as Record<string, unknown>;
					const requestId = row.requestId as string;
					return (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setSelectedRequestId(requestId)}
							className="h-8 px-2"
						>
							<TbEye className="h-4 w-4 mr-1" />
							Explore
						</Button>
					)
				},
			}),
			helper.accessor("createdAt", {
				header: "Timestamp",
				cell: (props) => {
					const timestamp = props.getValue() as string;
					return (
						<div className="flex flex-col">
							<span className="text-sm font-medium">
								{formatUTCTimestamp(timestamp)}
							</span>
						</div>
					)
				},
			}),
			helper.accessor("endpoint", {
				header: "Endpoint URL",
				cell: (props) => {
					const endpoint = props.getValue() as string;
					const row = props.row.original as Record<string, unknown>;
					const fullEndpoint = row.fullEndpoint as string;

					// Use fullEndpoint if available (includes query params), otherwise use endpoint
					const displayEndpoint = fullEndpoint || endpoint;

					return (
						<span
							className="font-mono text-sm"
							title={displayEndpoint}
						>
							{displayEndpoint && displayEndpoint.length > 50
								? `${displayEndpoint.substring(0, 50)}...`
								: displayEndpoint || endpoint}
						</span>
					)
				},
			}),
			helper.accessor("userName", {
				header: "User",
				cell: (props) => {
					const userName = props.getValue() as string;
					return userName ? (
						<span className="text-sm">{userName}</span>
					) : (
						<span className="text-sm text-muted-foreground">
							Anonymous
						</span>
					)
				},
			}),
			helper.accessor("responseTimeMs", {
				header: "Response Time",
				cell: (props) => {
					const responseTime = props.getValue() as number;
					if (!responseTime)
						return (
							<span className="text-sm text-muted-foreground">
								-
							</span>
						)
					return (
						<span
							className={`text-sm font-semibold ${getResponseTimeColor(responseTime)}`}
						>
							{responseTime}ms
						</span>
					)
				},
			}),
			helper.accessor("statusCode", {
				header: "Status Code",
				cell: (props) => {
					const statusCode = props.getValue() as number;
					if (!statusCode)
						return (
							<span className="text-sm text-muted-foreground">
								-
							</span>
						)
					return (
						<Badge variant={getStatusCodeVariant(statusCode)}>
							{statusCode}
						</Badge>
					)
				},
			}),
		],
	})

	return (
		<div className="space-y-6">
			{/* Header with back button */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate({ to: '/observability' })}
					className="flex items-center gap-2"
				>
					<TbArrowLeft className="h-4 w-4" />
					Back to Observability
				</Button>
				<div className="flex items-center gap-2">
					<Badge variant={getMethodVariant(method)}>{method}</Badge>
					<span className="font-mono text-sm text-muted-foreground">{endpoint}</span>
				</div>
			</div>

			{/* Table */}
			{tableComponent}

			{/* Request Detail Dialog */}
			{selectedRequestId && (
				<RequestDetailDialog
					requestId={selectedRequestId}
					isOpen={!!selectedRequestId}
					onClose={() => setSelectedRequestId(null)}
				/>
			)}
		</div>
	)
}

export const Route = createLazyFileRoute(
  '/_dashboardLayout/observability/endpoint-requests',
)({
  component: EndpointRequestsTable,
})
