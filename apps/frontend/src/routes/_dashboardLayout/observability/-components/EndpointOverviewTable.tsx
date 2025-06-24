import { Badge } from "@repo/ui";
import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";
import {
	formatUTCTimestamp,
	getResponseTimeColor,
	getMethodVariant,
	getSuccessRateVariant,
} from "./utils";

export function EndpointOverviewTable() {
	return createPageTemplate({
		title: "API Endpoint Overview",
		endpoint: client.observability["endpoint-overview"].$get,
		queryKey: ["observability", "endpoint-overview"],
		createButton: false,
		sortableColumns: [
			"endpoint",
			"totalRequests",
			"avgResponseTime",
			"successRate",
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
					return <Badge variant={getMethodVariant(method)}>{method}</Badge>;
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
						<span className={`text-sm font-semibold ${getResponseTimeColor(avgTime)}`}>
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
						<span className={`text-sm font-semibold ${getResponseTimeColor(p95Time)}`}>
							{p95Time.toFixed(1)}ms
						</span>
					);
				},
			}),
			helper.accessor("successRate", {
				header: "Success Rate",
				cell: (props) => {
					const successRate = props.getValue() as number;
					return <Badge variant={getSuccessRateVariant(successRate)}>{successRate.toFixed(1)}%</Badge>;
				},
			}),
			helper.accessor("lastRequest", {
				header: "Last Request",
				cell: (props) => {
					const timestamp = props.getValue() as string;
					return (
						<span className="text-sm">
							{formatUTCTimestamp(timestamp)}
						</span>
					);
				},
			}),
		],
	});
}
