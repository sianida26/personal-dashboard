import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useMemo, useState } from "react";
import {
	TbAlertTriangle,
	TbArrowLeft,
	TbChartBar,
	TbCheck,
	TbCode,
	TbCopy,
	TbEye,
	TbList,
} from "react-icons/tb";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	createPageTemplate,
	type QueryParams,
} from "@/components/PageTemplate";
import client from "@/honoClient";

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
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
											<TbCode className="h-5 w-5" />
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
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

// Analytics Charts Component
interface AnalyticsChartsProps {
	endpoint: string;
	method: string;
}

function AnalyticsCharts({ endpoint, method }: AnalyticsChartsProps) {
	const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

	// Chart configuration for status codes
	const chartConfig = {
		"2xx": {
			label: "2xx Success",
			color: "hsl(142, 76%, 36%)", // Green
		},
		"3xx": {
			label: "3xx Redirect",
			color: "hsl(210, 20%, 58%)", // Gray
		},
		"4xx": {
			label: "4xx Client Error",
			color: "hsl(45, 93%, 47%)", // Yellow
		},
		"5xx": {
			label: "5xx Server Error",
			color: "hsl(0, 84%, 60%)", // Red
		},
	} satisfies ChartConfig;

	// Calculate date range
	const { startDate, endDate } = useMemo(() => {
		const now = dayjs().utc();
		const days = timeRange === "7d" ? 7 : 30;
		return {
			startDate: now.subtract(days, "day").toISOString(),
			endDate: now.toISOString(),
		};
	}, [timeRange]);

	// Fetch analytics data
	const { data: analyticsData, isLoading } = useQuery({
		queryKey: ["observability", "analytics", endpoint, method, timeRange],
		queryFn: async () => {
			const response = await client.observability.requests.$get({
				query: {
					routePath: endpoint,
					method,
					startDate,
					endDate,
					limit: "1000", // Get more data for analytics
				},
			});
			if (!response.ok) {
				throw new Error("Failed to fetch analytics data");
			}
			const result = await response.json();
			return result.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	// Process data for charts
	const { chartData, statistics } = useMemo(() => {
		if (!analyticsData)
			return {
				chartData: { dailyData: [], histogramData: [] },
				statistics: {
					totalRequests: 0,
					avgResponseTime: 0,
					maxResponseTime: 0,
					medianResponseTime: 0,
					p95ResponseTime: 0,
					successRate: 0,
					statusCounts: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
				},
			};

		// Calculate maximum response time for adaptive bins
		const maxTime = Math.max(
			...analyticsData.map(
				(item: AnalyticsItem) => item.responseTimeMs || 0,
			),
		);

		// Group by status code category
		const getStatusCategory = (statusCode: number): string => {
			if (statusCode >= 200 && statusCode < 300) return "2xx";
			if (statusCode >= 300 && statusCode < 400) return "3xx";
			if (statusCode >= 400 && statusCode < 500) return "4xx";
			if (statusCode >= 500) return "5xx";
			return "other";
		};
		// Type for analytics data item
		type AnalyticsItem = {
			id: string;
			requestId: string;
			userId: string | null;
			userName: string | null;
			method: string;
			endpoint: string;
			fullEndpoint: string;
			ipAddress: string | null;
			userAgent: string | null;
			statusCode: number | null;
			responseTimeMs: number | null;
			createdAt: string | null;
		};
		// Daily average response time data
		const dailyGroups = analyticsData.reduce(
			(
				acc: Record<
					string,
					{
						responses: number[];
						total: number;
						categories: Record<
							string,
							{ times: number[]; count: number }
						>;
					}
				>,
				item: AnalyticsItem,
			) => {
				if (!item.createdAt) return acc;

				const day = dayjs(item.createdAt).format("MMM DD");
				const statusCategory = getStatusCategory(item.statusCode || 0);
				const responseTime = item.responseTimeMs || 0;

				if (!acc[day]) {
					acc[day] = {
						responses: [],
						total: 0,
						categories: {
							"2xx": { times: [], count: 0 },
							"3xx": { times: [], count: 0 },
							"4xx": { times: [], count: 0 },
							"5xx": { times: [], count: 0 },
						},
					};
				}

				acc[day].responses.push(responseTime);
				acc[day].total++;
				acc[day].categories[statusCategory].times.push(responseTime);
				acc[day].categories[statusCategory].count++;

				return acc;
			},
			{},
		);

		// Generate all days in the range to avoid skipping dates
		const days = timeRange === "7d" ? 7 : 30;
		const allDays = Array.from({ length: days }, (_, i) => {
			return dayjs()
				.utc()
				.subtract(days - 1 - i, "day")
				.format("MMM DD");
		});

		const dailyData = allDays.map((day) => {
			const data = dailyGroups[day];
			const result: Record<string, number | string> = { day };

			if (data) {
				// Calculate average response time for each status category
				Object.entries(data.categories).forEach(
					([category, categoryData]) => {
						if (categoryData.times.length > 0) {
							result[category] = Math.round(
								categoryData.times.reduce(
									(sum, time) => sum + time,
									0,
								) / categoryData.times.length,
							);
						} else {
							result[category] = 0;
						}
					},
				);
			} else {
				// No data for this day, set all to 0
				result["2xx"] = 0;
				result["3xx"] = 0;
				result["4xx"] = 0;
				result["5xx"] = 0;
			}

			return result;
		});

		// Response time histogram data - 1ms granularity with adaptive max
		const createAdaptiveBins = (maxTime: number) => {
			const bins = [];

			// Create 1ms bins up to the maximum response time
			for (let i = 0; i <= maxTime; i++) {
				bins.push({
					range: `${i}ms`,
					min: i,
					max: i + 1,
					order: i + 1,
				});
			}

			return bins;
		};

		const histogramBins = createAdaptiveBins(maxTime);

		const histogramData = histogramBins
			.map((bin) => {
				// Count requests in this bin by status category
				const binData = {
					"2xx": 0,
					"3xx": 0,
					"4xx": 0,
					"5xx": 0,
				};

				analyticsData.forEach((item: AnalyticsItem) => {
					const responseTime = Math.floor(item.responseTimeMs || 0); // Floor to match bin
					const statusCategory = getStatusCategory(
						item.statusCode || 0,
					);

					if (responseTime === bin.min) {
						// Exact match for 1ms bins
						binData[statusCategory as keyof typeof binData]++;
					}
				});

				return {
					range: bin.range,
					order: bin.order,
					...binData,
				};
			})
			.sort((a, b) => a.order - b.order);

		// Calculate statistical metrics
		const responseTimes = analyticsData.map((item: AnalyticsItem) => item.responseTimeMs || 0).filter(time => time > 0);
		const totalRequests = analyticsData.length;
		
		// Basic statistics
		const avgResponseTime = responseTimes.length > 0 
			? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
			: 0;
		
		const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
		
		// Calculate median (50th percentile)
		const sortedTimes = [...responseTimes].sort((a, b) => a - b);
		const medianResponseTime = sortedTimes.length > 0
			? sortedTimes.length % 2 === 0
				? Math.round((sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2)
				: sortedTimes[Math.floor(sortedTimes.length / 2)]
			: 0;
		
		// Calculate 95th percentile
		const p95ResponseTime = sortedTimes.length > 0
			? sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0
			: 0;
		
		// Status code distribution
		const statusCounts = {
			"2xx": 0,
			"3xx": 0,
			"4xx": 0,
			"5xx": 0,
		};
		
		analyticsData.forEach((item: AnalyticsItem) => {
			const statusCategory = getStatusCategory(item.statusCode || 0);
			if (statusCategory !== "other") {
				statusCounts[statusCategory as keyof typeof statusCounts]++;
			}
		});
		
		const successRate = totalRequests > 0 
			? Math.round((statusCounts["2xx"] / totalRequests) * 100)
			: 0;

		return {
			chartData: { dailyData, histogramData },
			statistics: {
				totalRequests,
				avgResponseTime,
				maxResponseTime,
				medianResponseTime,
				p95ResponseTime,
				successRate,
				statusCounts,
			},
		};
	}, [analyticsData]);

	if (isLoading) {
		return (
			<div className="space-y-6 mb-6">
				{/* Loading Analytics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{["total", "success", "avg", "p95"].map((cardType) => (
						<Card key={cardType}>
							<CardHeader className="pb-3">
								<div className="h-4 w-24 bg-muted animate-pulse rounded" />
							</CardHeader>
							<CardContent>
								<div className="h-8 w-16 bg-muted animate-pulse rounded" />
							</CardContent>
						</Card>
					))}
				</div>
				
				{/* Loading Secondary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
					{["min", "median", "2xx", "3xx", "4xx", "5xx"].map((cardType) => (
						<Card key={cardType}>
							<CardHeader className="pb-3">
								<div className="h-4 w-20 bg-muted animate-pulse rounded" />
							</CardHeader>
							<CardContent>
								<div className="h-6 w-12 bg-muted animate-pulse rounded" />
							</CardContent>
						</Card>
					))}
				</div>
				
				{/* Loading Charts */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<div className="h-6 w-48 bg-muted animate-pulse rounded" />
						</CardHeader>
						<CardContent>
							<div className="h-80 bg-muted animate-pulse rounded" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<div className="h-6 w-48 bg-muted animate-pulse rounded" />
						</CardHeader>
						<CardContent>
							<div className="h-80 bg-muted animate-pulse rounded" />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 mb-6">
			{/* Time Range Selector */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-medium flex items-center gap-2">
						<TbChartBar className="h-5 w-5" />
						Analytics
					</h3>
					<p className="text-sm text-muted-foreground">
						Response time analysis for {method} {endpoint}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant={timeRange === "7d" ? "default" : "outline"}
						size="sm"
						onClick={() => setTimeRange("7d")}
					>
						Last 7 days
					</Button>
					<Button
						variant={timeRange === "30d" ? "default" : "outline"}
						size="sm"
						onClick={() => setTimeRange("30d")}
					>
						Last 30 days
					</Button>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Requests
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statistics.totalRequests.toLocaleString()}
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Success Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{statistics.successRate}%
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{statistics.statusCounts["2xx"]} successful requests
						</p>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Average Response Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statistics.avgResponseTime}ms
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							95th Percentile
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statistics.p95ResponseTime}ms
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Response Time Statistics */}
			<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Max Response Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold">
							{statistics.maxResponseTime}ms
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Median Response Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold">
							{statistics.medianResponseTime}ms
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							2xx Success
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold text-green-600">
							{statistics.statusCounts["2xx"]}
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							3xx Redirect
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold text-gray-600">
							{statistics.statusCounts["3xx"]}
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							4xx Client Error
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold text-yellow-600">
							{statistics.statusCounts["4xx"]}
						</div>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							5xx Server Error
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold text-red-600">
							{statistics.statusCounts["5xx"]}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts in horizontal layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Daily Average Response Time Chart */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TbChartBar className="h-5 w-5" />
							Average Response Time per Day
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Daily average response times grouped by status code
						</p>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-80">
							<BarChart data={chartData.dailyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="day" />
								<YAxis
									label={{
										value: "Response Time (ms)",
										angle: -90,
										position: "insideLeft",
									}}
								/>
								<ChartTooltip
									content={<ChartTooltipContent />}
								/>
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="2xx"
									stackId="a"
									fill="var(--color-2xx)"
								/>
								<Bar
									dataKey="3xx"
									stackId="a"
									fill="var(--color-3xx)"
								/>
								<Bar
									dataKey="4xx"
									stackId="a"
									fill="var(--color-4xx)"
								/>
								<Bar
									dataKey="5xx"
									stackId="a"
									fill="var(--color-5xx)"
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Response Time Histogram */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TbChartBar className="h-5 w-5" />
							Response Time Distribution
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							1ms granularity distribution
						</p>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-80">
							<BarChart data={chartData.histogramData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="range" type="category" />
								<YAxis
									label={{
										value: "Request Count",
										angle: -90,
										position: "insideLeft",
									}}
								/>
								<ChartTooltip
									content={<ChartTooltipContent />}
									labelFormatter={(value) => `${value}`}
								/>
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="2xx"
									stackId="a"
									fill="var(--color-2xx)"
								/>
								<Bar
									dataKey="3xx"
									stackId="a"
									fill="var(--color-3xx)"
								/>
								<Bar
									dataKey="4xx"
									stackId="a"
									fill="var(--color-4xx)"
								/>
								<Bar
									dataKey="5xx"
									stackId="a"
									fill="var(--color-5xx)"
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function EndpointRequestsTable() {
	const navigate = useNavigate();
	const { endpoint, method } = useSearch({
		from: "/_dashboardLayout/observability/endpoint-requests",
	});
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
		null,
	);

	// Create a wrapper endpoint that includes the filters
	const filteredEndpoint = async (
		args: Record<string, unknown> & { query: QueryParams },
	) => {
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
					);
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
					);
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
						<span
							className={`text-sm font-semibold ${getResponseTimeColor(responseTime)}`}
						>
							{responseTime}ms
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
					return (
						<Badge variant={getStatusCodeVariant(statusCode)}>
							{statusCode}
						</Badge>
					);
				},
			}),
		],
	});

	return (
		<div className="container mx-auto px-4 py-6 space-y-6">
			{/* Header with back button */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate({ to: "/observability" })}
					className="flex items-center gap-2"
				>
					<TbArrowLeft className="h-4 w-4" />
					Back to Observability
				</Button>
				<div className="flex items-center gap-2">
					<Badge variant={getMethodVariant(method)}>{method}</Badge>
					<span className="font-mono text-sm text-muted-foreground">
						{endpoint}
					</span>
				</div>
			</div>

			{/* Analytics Charts */}
			<AnalyticsCharts endpoint={endpoint} method={method} />

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
	);
}

export const Route = createLazyFileRoute(
	"/_dashboardLayout/observability/endpoint-requests",
)({
	component: EndpointRequestsTable,
});
