import { Badge, SidebarTrigger } from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useMatches } from "@tanstack/react-router";
import { TbBell } from "react-icons/tb";
import { fetchUnreadCount } from "@/modules/notifications/api";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";

export default function AppHeader() {
	const matches = useMatches();
	const { data: unreadCount } = useQuery({
		queryKey: notificationQueryKeys.unreadCount,
		queryFn: fetchUnreadCount,
		// Only refetch if not in error state to avoid hammering failed server
		refetchInterval: (query) => {
			// Stop refetching if query is in error state
			if (query.state.status === "error") return false;
			return 30_000;
		},
		// Gracefully handle network errors
		retry: (failureCount, error) => {
			if (failureCount >= 2) return false;
			const isNetworkError =
				error instanceof Error &&
				(error.message.includes("NetworkError") ||
					error.message.includes("Failed to fetch"));
			return isNetworkError;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
	});

	const pageTitle = matches[matches.length - 1]?.staticData.title ?? "";

	return (
		<div className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background px-4">
			{/* Left Side */}
			<div className="flex flex-1 min-w-0 items-center gap-4">
				<SidebarTrigger />

				<div className="font-semibold truncate">{pageTitle}</div>
			</div>

			{/* RIght Side */}
			<div className="flex shrink-0 items-center gap-2">
				<Link
					to="/notifications"
					className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted"
				>
					<span className="relative inline-flex">
						<TbBell className="h-5 w-5" />
						{unreadCount ? (
							<Badge className="absolute -right-1 -top-1 h-4 min-w-[1.25rem] justify-center rounded-full bg-primary text-[10px] leading-none text-primary-foreground">
								{unreadCount > 99 ? "99+" : unreadCount}
							</Badge>
						) : null}
					</span>
					<span>Notifications</span>
				</Link>
			</div>
		</div>
	);
}
