import { Badge } from "@repo/ui";
import { createPageTemplate, type QueryParams } from "@/components/PageTemplate";
import client from "@/honoClient";
import { formatUTCTimestamp } from "./utils";

export function FrontendLogsTable() {
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
