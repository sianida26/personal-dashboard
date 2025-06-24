import { createLazyFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Tabs, TabList, TabTrigger, TabPanel } from "@repo/ui";
import { TbActivity, TbAlertTriangle, TbClock, TbEye } from "react-icons/tb";
import { createPageTemplate, type QueryParams } from "@/components/PageTemplate";
import client from "@/honoClient";

export const Route = createLazyFileRoute("/_dashboardLayout/observability")({
	component: ObservabilityPage,
});

function ObservabilityPage() {
	return (
		<div className="container mx-auto p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Observability
					</h1>
					<p className="text-muted-foreground">
						Monitor your application's performance and health
					</p>
				</div>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabList>
					<TabTrigger value="overview">Overview</TabTrigger>
					<TabTrigger value="endpoints">API Endpoints</TabTrigger>
					<TabTrigger value="requests">Requests</TabTrigger>
					<TabTrigger value="logs">Frontend Logs</TabTrigger>
					<TabTrigger value="errors">Errors</TabTrigger>
				</TabList>

				<TabPanel value="overview" className="space-y-6">
					<MetricsOverview />
				</TabPanel>

				<TabPanel value="endpoints" className="space-y-6">
					<EndpointOverviewTable />
				</TabPanel>

				<TabPanel value="requests" className="space-y-6">
					<RequestsTable />
				</TabPanel>

				<TabPanel value="logs" className="space-y-6">
					<FrontendLogsTable />
				</TabPanel>

				<TabPanel value="errors" className="space-y-6">
					<ErrorsTable />
				</TabPanel>
			</Tabs>
		</div>
	);
}

function MetricsOverview() {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Requests
						</CardTitle>
						<TbActivity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">45,231</div>
						<p className="text-xs text-muted-foreground">
							+20.1% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Average Response Time
						</CardTitle>
						<TbClock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">145ms</div>
						<p className="text-xs text-muted-foreground">
							-5.2% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Error Rate
						</CardTitle>
						<TbAlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">2.3%</div>
						<p className="text-xs text-muted-foreground">
							+0.1% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Users
						</CardTitle>
						<TbEye className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">1,234</div>
						<p className="text-xs text-muted-foreground">
							+12.3% from last month
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Add a note about the current status */}
			<Card className="bg-blue-50 border-blue-200">
				<CardContent className="pt-6">
					<div className="flex items-start space-x-3">
						<TbActivity className="h-5 w-5 text-blue-600 mt-0.5" />
						<div>
							<h4 className="text-sm font-medium text-blue-900">
								Observability Status
							</h4>
							<p className="text-sm text-blue-700 mt-1">
								The observability system is collecting data.
								Check the Events, Requests, and Errors tabs to
								view detailed information. If tables show "No
								Data", ensure you have the required permissions
								and that the backend is generating observability
								events.
							</p>
							<button
								type="button"
								className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
								onClick={() => {
									// Generate a test frontend error for testing
									console.error("Test error for observability:", new Error("This is a test error"));
									// Don't actually throw to avoid breaking the UI
									// throw new Error("Test error for observability system");
								}}
							>
								Generate Test Error
							</button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function EndpointOverviewTable() {
	return createPageTemplate({
		title: "API Endpoint Overview",
		endpoint: client.observability["endpoint-overview"].$get,
		queryKey: ["observability", "endpoint-overview"],
		createButton: false,
		sortableColumns: [
			"endpoint",
			"totalRequests",
			"avgResponseTime",
			"errorRate",
		],
		filterableColumns: [
			{
				id: "method",
				type: "select",
				options: [
					{ label: "GET", value: "GET" },
					{ label: "POST", value: "POST" },
					{ label: "PUT", value: "PUT" },
					{ label: "DELETE", value: "DELETE" },
				],
				label: "Method",
			},
		],
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
			helper.accessor("endpoint", {
				header: "Endpoint",
				cell: (props) => {
					const endpoint = props.getValue() as string;
					const row = props.row.original as Record<string, unknown>;
					const queryParams = row.queryParams as Record<
						string,
						unknown
					> | null;

					// Build full endpoint with query params if they exist
					let fullEndpoint = endpoint;
					if (queryParams && Object.keys(queryParams).length > 0) {
						const queryString = Object.entries(queryParams)
							.map(([key, value]) => `${key}=${value}`)
							.join("&");
						fullEndpoint = `${endpoint}?${queryString}`;
					}

					return (
						<span
							className="font-mono text-sm"
							title={fullEndpoint}
						>
							{fullEndpoint}
						</span>
					);
				},
			}),
			helper.accessor("method", {
				header: "Method",
				cell: (props) => {
					const method = props.getValue() as string;
					const variant =
						method === "GET"
							? "default"
							: method === "POST"
								? "default"
								: method === "PUT"
									? "secondary"
									: method === "DELETE"
										? "destructive"
										: "outline";
					return <Badge variant={variant}>{method}</Badge>;
				},
			}),
			helper.accessor("totalRequests", {
				header: "Total Requests",
				cell: (props) => (
					<span className="text-sm font-mono">
						{(props.getValue() as number).toLocaleString()}
					</span>
				),
			}),
			helper.accessor("avgResponseTime", {
				header: "Avg Response Time",
				cell: (props) => {
					const avgTime = props.getValue() as number;
					return (
						<span className="text-sm font-mono">
							{avgTime.toFixed(1)}ms
						</span>
					);
				},
			}),
			helper.accessor("p95ResponseTime", {
				header: "P95 Response Time",
				cell: (props) => {
					const p95Time = props.getValue() as number;
					return (
						<span className="text-sm font-mono">
							{p95Time.toFixed(1)}ms
						</span>
					);
				},
			}),
			helper.accessor("successRate", {
				header: "Success Rate",
				cell: (props) => {
					const successRate = props.getValue() as number;
					const variant =
						successRate >= 95
							? "default"
							: successRate >= 90
								? "secondary"
								: "destructive";
					return <Badge variant={variant}>{successRate.toFixed(1)}%</Badge>;
				},
			}),
			helper.accessor("errorRate", {
				header: "Error Rate",
				cell: (props) => {
					const errorRate = props.getValue() as number;
					const variant =
						errorRate < 5
							? "default"
							: errorRate < 10
								? "secondary"
								: "destructive";
					return (
						<Badge variant={variant}>{errorRate.toFixed(1)}%</Badge>
					);
				},
			}),
			helper.accessor("lastRequest", {
				header: "Last Request",
				cell: (props) => {
					const date = new Date(props.getValue() as string);
					return (
						<span className="text-sm">
							{date.toLocaleDateString()}{" "}
							{date.toLocaleTimeString()}
						</span>
					);
				},
			}),
		],
	});
}

function FrontendLogsTable() {
	// Create a wrapper that filters for frontend logs
	const frontendLogsEndpoint = async (
		args: Record<string, unknown> & {
			query: QueryParams;
		},
	) => {
		const response = await client.observability.events.$get({
			...args,
			query: {
				...args.query,
				eventType: "frontend_log",
			},
		});
		return response;
	};

	return createPageTemplate({
		title: "Frontend Logs",
		endpoint: frontendLogsEndpoint,
		queryKey: ["observability", "frontend-logs"],
		createButton: false,
		sortableColumns: ["timestamp", "endpoint", "errorMessage"],
		filterableColumns: [
			{
				id: "endpoint",
				type: "select",
				options: [
					{ label: "Debug", value: "debug" },
					{ label: "Log", value: "log" },
					{ label: "Info", value: "info" },
					{ label: "Warn", value: "warn" },
					{ label: "Error", value: "error" },
				],
				label: "Log Level",
			},
		],
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
			helper.accessor("timestamp", {
				header: "Timestamp",
				cell: (props) => {
					const date = new Date(props.getValue() as string);
					return (
						<div className="flex flex-col">
							<span className="text-sm font-medium">
								{date.toLocaleDateString()}{" "}
								{date.toLocaleTimeString()}
							</span>
						</div>
					);
				},
			}),
			helper.accessor("metadata", {
				header: "Log Level",
				cell: (props) => {
					const metadata = props.getValue() as Record<
						string,
						unknown
					>;
					const logLevel = (metadata?.logLevel as string) || "log";
					const variant =
						logLevel === "error"
							? "destructive"
							: logLevel === "warn"
								? "default"
								: logLevel === "info"
									? "default"
									: logLevel === "debug"
										? "secondary"
										: "outline";
					return (
						<Badge variant={variant}>
							{logLevel.toUpperCase()}
						</Badge>
					);
				},
			}),
			helper.accessor("endpoint", {
				header: "Route",
				cell: (props) => (
					<span className="font-mono text-sm">
						{(props.getValue() as string) || "/"}
					</span>
				),
			}),
			helper.accessor("metadata", {
				header: "Log Message",
				cell: (props) => {
					const metadata = props.getValue() as Record<
						string,
						unknown
					>;
					const logMessage = metadata?.logMessage as string;
					if (!logMessage || logMessage === "-") {
						// If no logMessage in metadata, try errorMessage for errors
						const errorMessage = (
							props.row.original as { errorMessage?: string }
						).errorMessage;
						const message = errorMessage || "No message";
						return (
							<span
								className="text-sm max-w-md truncate"
								title={message}
							>
								{message}
							</span>
						);
					}
					return (
						<span
							className="text-sm max-w-md truncate"
							title={logMessage}
						>
							{logMessage}
						</span>
					);
				},
			}),
			helper.accessor("userName", {
				header: "User",
				cell: (props) => {
					const userName = props.getValue() as string;
					const row = props.row.original as Record<string, unknown>;
					const userId = row.userId as string;

					return userName ? (
						<span className="text-sm">{userName}</span>
					) : userId ? (
						<span className="text-sm font-mono text-muted-foreground">
							{userId}
						</span>
					) : (
						<span className="text-sm text-muted-foreground">
							Anonymous
						</span>
					);
				},
			}),
		],
	});
}

function RequestsTable() {
	return createPageTemplate({
		title: "Request Details",
		endpoint: client.observability.requests.$get,
		queryKey: ["observability", "requests"],
		createButton: false,
		sortableColumns: ["createdAt", "endpoint", "method"],
		filterableColumns: [
			{
				id: "method",
				type: "select",
				options: [
					{ label: "GET", value: "GET" },
					{ label: "POST", value: "POST" },
					{ label: "PUT", value: "PUT" },
					{ label: "DELETE", value: "DELETE" },
				],
				label: "Method",
			},
		],
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
			helper.accessor("createdAt", {
				header: "Timestamp",
				cell: (props) => {
					const date = new Date(props.getValue() as string);
					return (
						<div className="flex flex-col">
							<span className="text-sm font-medium">
								{date.toLocaleDateString()}{" "}
								{date.toLocaleTimeString()}
							</span>
						</div>
					);
				},
			}),
			helper.accessor("method", {
				header: "Method",
				cell: (props) => {
					const method = props.getValue() as string;
					const variant =
						method === "GET"
							? "default"
							: method === "POST"
								? "default"
								: method === "PUT"
									? "secondary"
									: method === "DELETE"
										? "destructive"
										: "outline";
					return <Badge variant={variant}>{method}</Badge>;
				},
			}),
			helper.accessor("endpoint", {
				header: "Endpoint",
				cell: (props) => {
					const endpoint = props.getValue() as string;
					const row = props.row.original as Record<string, unknown>;
					const queryParams = row.queryParams as Record<
						string,
						unknown
					> | null;

					// Build full endpoint with query params if they exist
					let fullEndpoint = endpoint;
					if (queryParams && Object.keys(queryParams).length > 0) {
						const queryString = Object.entries(queryParams)
							.map(([key, value]) => `${key}=${value}`)
							.join("&");
						fullEndpoint = `${endpoint}?${queryString}`;
					}

					return (
						<span
							className="font-mono text-sm"
							title={fullEndpoint}
						>
							{fullEndpoint.length > 50
								? `${fullEndpoint.substring(0, 50)}...`
								: fullEndpoint}
						</span>
					);
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
					);
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
						);
					const variant =
						statusCode < 300
							? "default"
							: statusCode < 400
								? "secondary"
								: statusCode < 500
									? "default"
									: "destructive";
					return <Badge variant={variant}>{statusCode}</Badge>;
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
						);
					return (
						<span className="text-sm font-mono">
							{responseTime}ms
						</span>
					);
				},
			}),
			helper.accessor("ipAddress", {
				header: "IP Address",
				cell: (props) => (
					<span className="font-mono text-sm">
						{(props.getValue() as string) || "-"}
					</span>
				),
			}),
			helper.accessor("userAgent", {
				header: "User Agent",
				cell: (props) => {
					const userAgent = props.getValue() as string;
					if (!userAgent) return "-";
					return (
						<span
							className="text-sm truncate max-w-xs"
							title={userAgent}
						>
							{userAgent}
						</span>
					);
				},
			}),
		],
	});
}

function ErrorsTable() {
	return createPageTemplate({
		title: "Error Events",
		endpoint: client.observability["error-events"].$get,
		queryKey: ["observability", "error-events"],
		createButton: false,
		sortableColumns: ["timestamp", "eventType", "endpoint", "errorMessage"],
		filterableColumns: [
			{
				id: "eventType",
				type: "select",
				options: [
					{ label: "All Errors", value: "" },
					{ label: "Frontend Error", value: "frontend_error" },
					{ label: "API Error (400+)", value: "api_request" },
				],
				label: "Error Source",
			},
		],
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
			helper.accessor("timestamp", {
				header: "Timestamp",
				cell: (props) => {
					const date = new Date(props.getValue() as string);
					return (
						<div className="flex flex-col">
							<span className="text-sm font-medium">
								{date.toLocaleDateString()}{" "}
								{date.toLocaleTimeString()}
							</span>
						</div>
					);
				},
			}),
			helper.accessor("eventType", {
				header: "Error Source",
				cell: (props) => {
					const eventType = props.getValue() as string;
					const row = props.row.original as Record<string, unknown>;
					const statusCode = row.statusCode as number;
					
					// Determine if this is actually an error
					const isError = eventType === "frontend_error" || 
								   (eventType === "api_request" && statusCode && statusCode >= 400);
					
					if (!isError) {
						return <Badge variant="outline">Not Error</Badge>;
					}
					
					const variant = eventType === "frontend_error" ? "destructive" : "secondary";
					const label = eventType === "frontend_error" ? "Frontend" : "Backend API";
					return <Badge variant={variant}>{label}</Badge>;
				},
			}),
			helper.accessor("endpoint", {
				header: "Route/Endpoint",
				cell: (props) => (
					<span className="font-mono text-sm">
						{props.getValue() as string}
					</span>
				),
			}),
			helper.accessor("userName", {
				header: "User",
				cell: (props) => {
					const userName = props.getValue() as string;
					const row = props.row.original as Record<string, unknown>;
					const userId = row.userId as string;

					return userName ? (
						<span className="text-sm">{userName}</span>
					) : userId ? (
						<span className="text-sm font-mono text-muted-foreground">
							{userId}
						</span>
					) : (
						<span className="text-sm text-muted-foreground">
							Anonymous
						</span>
					);
				},
			}),
			helper.accessor("statusCode", {
				header: "Status Code",
				cell: (props) => {
					const statusCode = props.getValue() as number;
					if (!statusCode) return "-";
					const variant =
						statusCode >= 500 ? "destructive" : "default";
					return <Badge variant={variant}>{statusCode}</Badge>;
				},
			}),
			helper.accessor("errorMessage", {
				header: "Error Message",
				cell: (props) => {
					const error = props.getValue() as string;
					if (!error) return "-";
					return (
						<span
							className="text-sm text-red-600 truncate max-w-md"
							title={error}
						>
							{error}
						</span>
					);
				},
			}),
			helper.accessor("stackTrace", {
				header: "Stack Trace",
				cell: (props) => {
					const stackTrace = props.getValue() as string;
					if (!stackTrace) return "-";
					return (
						<button
							type="button"
							className="text-sm text-blue-600 hover:text-blue-800 underline"
							onClick={() => {
								alert(stackTrace);
							}}
						>
							View Stack Trace
						</button>
					);
				},
			}),
		],
	});
}

export default ObservabilityPage;
