import { useState } from "react";
import { Badge, Button } from "@repo/ui";
import { TbEye } from "react-icons/tb";
import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";
import {
	formatUTCTimestamp,
	getStatusCodeVariant,
	getResponseTimeColor,
	getMethodVariant,
} from "./utils";
import { RequestDetailDialog } from "./RequestDetailDialog";

export function RequestsTable() {
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

	const tableComponent = createPageTemplate({
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
			helper.accessor("method", {
				header: "Method",
				cell: (props) => {
					const method = props.getValue() as string;
					return <Badge variant={getMethodVariant(method)}>{method}</Badge>;
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
					return <Badge variant={getStatusCodeVariant(statusCode)}>{statusCode}</Badge>;
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
						<span className={`text-sm font-semibold ${getResponseTimeColor(responseTime)}`}>
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

	return (
		<>
			{tableComponent}
			{selectedRequestId && (
				<RequestDetailDialog
					requestId={selectedRequestId}
					isOpen={!!selectedRequestId}
					onClose={() => setSelectedRequestId(null)}
				/>
			)}
		</>
	);
}
