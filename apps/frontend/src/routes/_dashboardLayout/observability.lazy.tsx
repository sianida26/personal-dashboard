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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Observability</h1>
					<p className="text-muted-foreground">Monitor your application's performance and health</p>
				</div>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabList>
					<TabTrigger value="overview">Overview</TabTrigger>
					<TabTrigger value="events">Events</TabTrigger>  
					<TabTrigger value="requests">Requests</TabTrigger>
					<TabTrigger value="errors">Errors</TabTrigger>
				</TabList>

				<TabPanel value="overview" className="space-y-6">
					<MetricsOverview />
				</TabPanel>

				<TabPanel value="events" className="space-y-6">
					<EventsTable />
				</TabPanel>

				<TabPanel value="requests" className="space-y-6">
					<RequestsTable />
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
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total Requests</CardTitle>
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
					<CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
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
					<CardTitle className="text-sm font-medium">Error Rate</CardTitle>
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
					<CardTitle className="text-sm font-medium">Active Users</CardTitle>
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
	);
}

function EventsTable() {
	return createPageTemplate({
		title: "Observability Events",
		endpoint: client.observability.events.$get,
		queryKey: ["observability", "events"],
		createButton: false,
		sortableColumns: ["timestamp", "eventType", "endpoint", "statusCode", "responseTimeMs"],
		filterableColumns: [
			{
				id: "eventType",
				type: "select",
				options: [
					{ label: "API Request", value: "api_request" },
					{ label: "Frontend Error", value: "frontend_error" },
					{ label: "Frontend Metric", value: "frontend_metric" },
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
								{date.toLocaleDateString()} {date.toLocaleTimeString()}
							</span>  
						</div>
					);
				},
			}),
			helper.accessor("eventType", {
				header: "Event Type",
				cell: (props) => {
					const eventType = props.getValue() as string;
					const variant = eventType === "api_request" ? "default" : 
								 eventType === "frontend_error" ? "destructive" : "secondary";
					return (
						<Badge variant={variant}>
							{eventType.replace("_", " ").toUpperCase()}
						</Badge>
					);
				},
			}),
			helper.accessor("endpoint", {
				header: "Endpoint",
				cell: (props) => (
					<span className="font-mono text-sm">{props.getValue() as string}</span>
				),
			}),
			helper.accessor("method", {
				header: "Method",
				cell: (props) => {
					const method = props.getValue() as string;
					if (!method) return "-";
					return (
						<Badge variant="outline">
							{method}
						</Badge>
					);
				},
			}),
			helper.accessor("statusCode", {
				header: "Status",
				cell: (props) => {
					const statusCode = props.getValue() as number;
					if (!statusCode) return "-";
					const variant = statusCode < 300 ? "default" : 
								 statusCode < 400 ? "secondary" : 
								 statusCode < 500 ? "default" : "destructive";
					return (
						<Badge variant={variant}>
							{statusCode}
						</Badge>
					);
				},
			}),
			helper.accessor("responseTimeMs", {
				header: "Response Time",
				cell: (props) => {
					const responseTime = props.getValue() as number;
					if (!responseTime) return "-";
					return (
						<span className="text-sm font-mono">
							{responseTime}ms
						</span>
					);
				},
			}),
			helper.accessor("errorMessage", {
				header: "Error",
				cell: (props) => {
					const error = props.getValue() as string;
					if (!error) return "-";
					return (
						<span className="text-sm text-red-600 truncate max-w-xs" title={error}>
							{error}
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
								{date.toLocaleDateString()} {date.toLocaleTimeString()}
							</span>
						</div>
					);
				},
			}),
			helper.accessor("method", {
				header: "Method",
				cell: (props) => {
					const method = props.getValue() as string;
					const variant = method === "GET" ? "default" : 
								 method === "POST" ? "default" : 
								 method === "PUT" ? "secondary" : 
								 method === "DELETE" ? "destructive" : "outline";
					return (
						<Badge variant={variant}>
							{method}
						</Badge>
					);
				},
			}),
			helper.accessor("endpoint", {
				header: "Endpoint",
				cell: (props) => (
					<span className="font-mono text-sm">{props.getValue() as string}</span>
				),
			}),
			helper.accessor("ipAddress", {
				header: "IP Address",
				cell: (props) => (
					<span className="font-mono text-sm">{props.getValue() as string || "-"}</span>
				),
			}),
			helper.accessor("userAgent", {
				header: "User Agent",
				cell: (props) => {
					const userAgent = props.getValue() as string;
					if (!userAgent) return "-";
					return (
						<span className="text-sm truncate max-w-xs" title={userAgent}>
							{userAgent}
						</span>
					);
				},
			}),
		],
	});
}

function ErrorsTable() {
	// Create a wrapper that filters for frontend errors
	const errorEventsEndpoint = async (
		args: Record<string, unknown> & {
			query: QueryParams;
		}
	) => {
		const response = await client.observability.events.$get({
			...args,
			query: {
				...args.query,
				eventType: "frontend_error",
			},
		});
		return response;
	};

	return createPageTemplate({
		title: "Error Events",
		endpoint: errorEventsEndpoint,
		queryKey: ["observability", "errors"],
		createButton: false,
		sortableColumns: ["timestamp", "endpoint", "errorMessage"],
		filterableColumns: [
			{
				id: "endpoint",
				type: "select",
				options: [],
				label: "Endpoint/Route",
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
								{date.toLocaleDateString()} {date.toLocaleTimeString()}
							</span>
						</div>
					);
				},
			}),
			helper.accessor("endpoint", {
				header: "Route/Endpoint",
				cell: (props) => (
					<span className="font-mono text-sm">{props.getValue() as string}</span>
				),
			}),
			helper.accessor("errorMessage", {
				header: "Error Message",
				cell: (props) => {
					const error = props.getValue() as string;
					if (!error) return "-";
					return (
						<span className="text-sm text-red-600 truncate max-w-md" title={error}>
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
