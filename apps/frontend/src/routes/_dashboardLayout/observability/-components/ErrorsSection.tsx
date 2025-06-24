import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { NativeSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { TbAlertTriangle, TbCode, TbActivity } from "react-icons/tb";
import client from "@/honoClient";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { createPageTemplate } from "@/components/PageTemplate";
import { formatUTCTimestamp, getStatusCodeVariant, type ErrorEvent, type ErrorStatsProps } from "./utils";
import { StackTraceButton } from "./StackTraceButton";

// Configure dayjs to use UTC
dayjs.extend(utc);

function ErrorStats({ timeRange }: ErrorStatsProps) {
	const { startDate, endDate } = useMemo(() => {
		const now = dayjs().utc();
		switch (timeRange) {
			case "24h":
				return {
					startDate: now.subtract(24, "hour").toISOString(),
					endDate: now.toISOString(),
				};
			case "7d":
				return {
					startDate: now.subtract(7, "day").toISOString(),
					endDate: now.toISOString(),
				};
			case "30d":
				return {
					startDate: now.subtract(30, "day").toISOString(),
					endDate: now.toISOString(),
				};
		}
	}, [timeRange]);

	const { data: errorStats, isLoading } = useQuery({
		queryKey: ["observability", "error-stats", timeRange],
		queryFn: async () => {
			const response = await client.observability["error-events"].$get({
				query: {
					page: "1",
					limit: "1000", // Get all errors for stats
					startDate,
					endDate,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch error statistics");
			}

			const result = await response.json();
			const errors = result.data as ErrorEvent[];

			// Calculate statistics
			const totalErrors = errors.length;
			const frontendErrors = errors.filter(
				(e) => e.eventType === "frontend_error",
			).length;
			const backendErrors = errors.filter(
				(e) => e.eventType === "api_request",
			).length;

			// Group by endpoint
			const errorsByEndpoint = errors.reduce(
				(acc: Record<string, number>, error) => {
					const endpoint = error.endpoint || "Unknown";
					acc[endpoint] = (acc[endpoint] || 0) + 1;
					return acc;
				},
				{},
			);

			// Get top error endpoints
			const topErrorEndpoints = Object.entries(errorsByEndpoint)
				.sort(([, a], [, b]) => (b as number) - (a as number))
				.slice(0, 5)
				.map(([endpoint, count]) => ({ endpoint, count }));

			// Group by error message for common errors
			const errorsByMessage = errors.reduce(
				(acc: Record<string, number>, error) => {
					const message = error.errorMessage || "Unknown Error";
					// Truncate long messages for grouping
					const shortMessage =
						message.length > 100
							? message.substring(0, 100) + "..."
							: message;
					acc[shortMessage] = (acc[shortMessage] || 0) + 1;
					return acc;
				},
				{},
			);

			const commonErrors = Object.entries(errorsByMessage)
				.sort(([, a], [, b]) => (b as number) - (a as number))
				.slice(0, 5)
				.map(([message, count]) => ({ message, count }));

			return {
				totalErrors,
				frontendErrors,
				backendErrors,
				topErrorEndpoints,
				commonErrors,
			};
		},
	});

	if (isLoading) {
		return (
			<div className="text-center py-8">Loading error statistics...</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{/* Error Count Cards */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Total Errors
					</CardTitle>
					<TbAlertTriangle className="h-4 w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-red-600">
						{errorStats?.totalErrors || 0}
					</div>
					<p className="text-xs text-muted-foreground">
						In the last {timeRange}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Frontend Errors
					</CardTitle>
					<TbCode className="h-4 w-4 text-orange-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-orange-600">
						{errorStats?.frontendErrors || 0}
					</div>
					<p className="text-xs text-muted-foreground">
						Client-side errors
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Backend Errors
					</CardTitle>
					<TbActivity className="h-4 w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-red-600">
						{errorStats?.backendErrors || 0}
					</div>
					<p className="text-xs text-muted-foreground">
						API errors (4xx/5xx)
					</p>
				</CardContent>
			</Card>

			{/* Top Error Endpoints */}
			<Card className="col-span-full lg:col-span-2">
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Top Error Endpoints
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{errorStats?.topErrorEndpoints.length ? (
							errorStats.topErrorEndpoints.map((item) => (
								<div
									key={item.endpoint}
									className="flex items-center justify-between"
								>
									<span className="text-sm font-mono truncate flex-1 mr-2">
										{item.endpoint}
									</span>
									<Badge
										variant="outline"
										className="text-red-600"
									>
										{item.count} errors
									</Badge>
								</div>
							))
						) : (
							<p className="text-sm text-muted-foreground">
								No errors found
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Common Error Messages */}
			<Card className="col-span-full lg:col-span-1">
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Common Error Messages
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{errorStats?.commonErrors.length ? (
							errorStats.commonErrors.map((item) => (
								<div key={item.message} className="space-y-1">
									<div className="flex items-center justify-between">
										<Badge
											variant="outline"
											className="text-red-600"
										>
											{item.count}x
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground truncate">
										{item.message}
									</p>
								</div>
							))
						) : (
							<p className="text-sm text-muted-foreground">
								No errors found
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
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
					return <Badge variant={getStatusCodeVariant(statusCode)}>{statusCode}</Badge>;
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
					const row = props.row.original as Record<string, unknown>;
					if (!stackTrace) return "-";
					return (
						<StackTraceButton
							stackTrace={stackTrace}
							errorMessage={row.errorMessage as string}
							eventType={row.eventType as string}
							endpoint={row.endpoint as string}
							timestamp={row.timestamp as string}
						/>
					);
				},
			}),
		],
	});
}

export function ErrorsSection() {
	const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Error Overview</h2>
					<p className="text-sm text-muted-foreground">
						Monitor error patterns and common issues
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
			<ErrorStats timeRange={timeRange} />
			<ErrorsTable />
		</div>
	);
}
