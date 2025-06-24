import { createLazyFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Tabs, TabList, TabTrigger, TabPanel } from "@repo/ui";
import {
	TbActivity,
	TbAlertTriangle,
	TbClock,
	TbEye,
	TbTrendingUp,
	TbTrendingDown,
	TbMinus,
} from "react-icons/tb";
import { createPageTemplate, type QueryParams } from "@/components/PageTemplate";
import client from "@/honoClient";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
	NativeSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui";
import dayjs from "dayjs";

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
	const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

	// Calculate date range based on selection
	const { startDate, endDate, groupBy } = useMemo(() => {
		const now = dayjs();
		switch (timeRange) {
			case "24h":
				return {
					startDate: now.subtract(24, "hour").toISOString(),
					endDate: now.toISOString(),
					groupBy: "hour" as const,
				};
			case "7d":
				return {
					startDate: now.subtract(7, "day").toISOString(),
					endDate: now.toISOString(),
					groupBy: "day" as const,
				};
			case "30d":
				return {
					startDate: now.subtract(30, "day").toISOString(),
					endDate: now.toISOString(),
					groupBy: "day" as const,
				};
			default:
				return {
					startDate: now.subtract(24, "hour").toISOString(),
					endDate: now.toISOString(),
					groupBy: "hour" as const,
				};
		}
	}, [timeRange]);

	const {
		data: metricsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			"observability",
			"metrics",
			timeRange,
			startDate,
			endDate,
			groupBy,
		],
		queryFn: async () => {
			const response = await client.observability.metrics.$get({
				query: {
					startDate,
					endDate,
					groupBy,
				},
			});
			if (!response.ok) {
				throw new Error("Failed to fetch metrics");
			}
			return response.json();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});

	// Helper function to get trend indicator
	const getTrendIndicator = (current: number, previous: number) => {
		if (current === previous)
			return <TbMinus className="h-3 w-3 text-muted-foreground" />;
		if (current > previous)
			return <TbTrendingUp className="h-3 w-3 text-green-500" />;
		return <TbTrendingDown className="h-3 w-3 text-red-500" />;
	};

	// Helper function to calculate trend percentage
	const getTrendPercentage = (current: number, previous: number) => {
		if (previous === 0) return current > 0 ? "+100%" : "0%";
		const percentage = ((current - previous) / previous) * 100;
		return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(1)}%`;
	};

	// Calculate trend data from time series
	const calculateTrends = () => {
		if (
			!metricsData?.data?.timeSeries ||
			metricsData.data.timeSeries.length < 2
		) {
			return {
				requestsTrend: 0,
				responseTrend: 0,
				errorTrend: 0,
			};
		}

		const series = metricsData.data.timeSeries;
		const latest = series[series.length - 1];
		const previous = series[series.length - 2];

		return {
			requestsTrend: getTrendPercentage(latest.count, previous.count),
			responseTrend: getTrendPercentage(
				latest.avgResponseTime,
				previous.avgResponseTime,
			),
			errorTrend: getTrendPercentage(
				latest.errorRate,
				previous.errorRate,
			),
		};
	};

	const trends = calculateTrends();

	if (error) {
		return (
			<Card className="bg-red-50 border-red-200">
				<CardContent className="pt-6">
					<div className="flex items-start space-x-3">
						<TbAlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
						<div>
							<h4 className="text-sm font-medium text-red-900">
								Error Loading Metrics
							</h4>
							<p className="text-sm text-red-700 mt-1">
								Unable to load observability metrics. Please
								check your permissions and try again.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Time Range Selector */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-medium">System Overview</h3>
					<p className="text-sm text-muted-foreground">
						Key performance metrics for your application
					</p>
				</div>
				<NativeSelect
					value={timeRange}
					onValueChange={(value) =>
						setTimeRange(value as "24h" | "7d" | "30d")
					}
				>
					<SelectTrigger className="w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="24h">Last 24h</SelectItem>
						<SelectItem value="7d">Last 7 days</SelectItem>
						<SelectItem value="30d">Last 30 days</SelectItem>
					</SelectContent>
				</NativeSelect>
			</div>

			{/* Main Metrics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Requests
						</CardTitle>
						<TbActivity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? (
								<div className="h-8 w-20 bg-muted animate-pulse rounded" />
							) : (
								metricsData?.data?.overview?.totalRequests?.toLocaleString() ||
								"0"
							)}
						</div>
						<div className="flex items-center text-xs text-muted-foreground mt-1">
							{!isLoading &&
								metricsData &&
								getTrendIndicator(
									metricsData.data.overview.totalRequests,
									metricsData.data.timeSeries?.[
										metricsData.data.timeSeries.length - 2
									]?.count || 0,
								)}
							<span className="ml-1">
								{!isLoading && trends.requestsTrend !== "0%"
									? trends.requestsTrend
									: "No change"}{" "}
								from previous period
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Avg Response Time
						</CardTitle>
						<TbClock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? (
								<div className="h-8 w-20 bg-muted animate-pulse rounded" />
							) : (
								`${metricsData?.data?.overview?.avgResponseTime || 0}ms`
							)}
						</div>
						<div className="flex items-center text-xs text-muted-foreground mt-1">
							{!isLoading &&
								metricsData &&
								getTrendIndicator(
									metricsData.data.overview.avgResponseTime,
									metricsData.data.timeSeries?.[
										metricsData.data.timeSeries.length - 2
									]?.avgResponseTime || 0,
								)}
							<span className="ml-1">
								{!isLoading && trends.responseTrend !== "0%"
									? trends.responseTrend
									: "No change"}{" "}
								from previous period
							</span>
						</div>
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
						<div className="text-2xl font-bold">
							{isLoading ? (
								<div className="h-8 w-20 bg-muted animate-pulse rounded" />
							) : (
								`${metricsData?.data?.overview?.errorRate?.toFixed(1) || "0.0"}%`
							)}
						</div>
						<div className="flex items-center text-xs text-muted-foreground mt-1">
							{!isLoading &&
								metricsData &&
								getTrendIndicator(
									metricsData.data.overview.errorRate,
									metricsData.data.timeSeries?.[
										metricsData.data.timeSeries.length - 2
									]?.errorRate || 0,
								)}
							<span className="ml-1">
								{!isLoading && trends.errorTrend !== "0%"
									? trends.errorTrend
									: "No change"}{" "}
								from previous period
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Success Rate
						</CardTitle>
						<TbEye className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? (
								<div className="h-8 w-20 bg-muted animate-pulse rounded" />
							) : (
								`${metricsData?.data?.overview?.successRate?.toFixed(1) || "0.0"}%`
							)}
						</div>
						<div className="flex items-center text-xs text-muted-foreground mt-1">
							<span>
								{!isLoading && metricsData
									? `${metricsData.data.overview.totalRequests - Math.round((metricsData.data.overview.totalRequests * metricsData.data.overview.errorRate) / 100)} successful requests`
									: "Loading..."}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Status Code Distribution */}
			{!isLoading &&
				metricsData?.data?.statusCodeDistribution &&
				metricsData.data.statusCodeDistribution.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Status Code Distribution
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
								{metricsData.data.statusCodeDistribution
									.slice(0, 8)
									.map((status) => (
										<div
											key={status.statusCode}
											className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
										>
											<div className="flex items-center space-x-2">
												<Badge
													variant={
														(status.statusCode ||
															0) >= 200 &&
														(status.statusCode ||
															0) < 300
															? "default"
															: (status.statusCode ||
																		0) >=
																		400 &&
																	(status.statusCode ||
																		0) < 500
																? "destructive"
																: (status.statusCode ||
																			0) >=
																		500
																	? "destructive"
																	: "secondary"
													}
												>
													{status.statusCode || 0}
												</Badge>
												<span className="text-sm font-medium">
													{status.count.toLocaleString()}
												</span>
											</div>
											<span className="text-xs text-muted-foreground">
												{(
													(status.count /
														(metricsData?.data
															?.overview
															?.totalRequests ||
															1)) *
													100
												).toFixed(1)}
												%
											</span>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				)}

			{/* Top Endpoints */}
			{!isLoading &&
				metricsData?.data?.topEndpoints &&
				metricsData.data.topEndpoints.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Top Endpoints
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Most frequently accessed endpoints in the
								selected time range
							</p>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{metricsData.data.topEndpoints
									.slice(0, 5)
									.map((endpoint, index) => (
										<div
											key={endpoint.endpoint}
											className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
										>
											<div className="flex items-center space-x-3">
												<div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
													{index + 1}
												</div>
												<div>
													<div className="font-medium text-sm">
														{endpoint.endpoint}
													</div>
													<div className="text-xs text-muted-foreground">
														{endpoint.count.toLocaleString()}{" "}
														requests
													</div>
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm font-medium">
													{endpoint.avgResponseTime}ms
												</div>
												<div className="text-xs text-muted-foreground">
													{endpoint.errorRate.toFixed(
														1,
													)}
													% errors
												</div>
											</div>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				)}

			{/* Loading State */}
			{isLoading && (
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<div className="h-4 w-32 bg-muted animate-pulse rounded" />
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="h-8 w-full bg-muted animate-pulse rounded" />
								<div className="h-4 w-24 bg-muted animate-pulse rounded" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<div className="h-4 w-32 bg-muted animate-pulse rounded" />
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="h-8 w-full bg-muted animate-pulse rounded" />
								<div className="h-4 w-24 bg-muted animate-pulse rounded" />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Information Card */}
			<Card className="bg-blue-50 border-blue-200">
				<CardContent className="pt-6">
					<div className="flex items-start space-x-3">
						<TbActivity className="h-5 w-5 text-blue-600 mt-0.5" />
						<div>
							<h4 className="text-sm font-medium text-blue-900">
								Observability Status
							</h4>
							<p className="text-sm text-blue-700 mt-1">
								The observability system is collecting data from
								your application. Use the time range selector to
								view metrics for different periods. Check the
								other tabs for detailed request logs and error
								information.
							</p>
							<button
								type="button"
								className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
								onClick={() => {
									// Generate a test frontend error for testing
									console.error(
										"Test error for observability:",
										new Error("This is a test error"),
									);
									// Don't actually throw to avoid breaking the UI
								}}
							>
								Generate Test Error
							</button>
							<button
								type="button"
								className="mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 mr-2"
								onClick={() => {
									// Generate test frontend logs
									console.log(
										"Test log message for observability",
									);
									console.info(
										"Test info message for observability",
									);
									console.warn(
										"Test warning message for observability",
									);
								}}
							>
								Generate Test Logs
							</button>
							<button
								type="button"
								className="mt-2 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
								onClick={() => {
									// Trigger some API calls to generate request data
									window.location.reload();
								}}
							>
								Generate Requests
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
				id: "eventType",
				type: "select",
				options: [
					{ label: "All Frontend Logs", value: "" },
					{ label: "Frontend Log", value: "frontend_log" },
					{ label: "Frontend Error", value: "frontend_error" },
				],
				label: "Event Type",
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
