import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import {
	NativeSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui";
import {
	TbActivity,
	TbAlertTriangle,
	TbClock,
	TbEye,
	TbTrendingUp,
	TbTrendingDown,
	TbMinus,
} from "react-icons/tb";
import client from "@/honoClient";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getStatusCodeVariant } from "./utils";

// Configure dayjs to use UTC
dayjs.extend(utc);

export function MetricsOverview() {
	const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

	// Calculate date range based on selection
	const { startDate, endDate, groupBy } = useMemo(() => {
		const now = dayjs().utc();
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
													variant={getStatusCodeVariant(
														status.statusCode || 0,
													)}
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
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
