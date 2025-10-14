import { Link, useMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger, Badge } from "@repo/ui";
import { TbBell } from "react-icons/tb";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";
import { fetchUnreadCount } from "@/modules/notifications/api";

export default function AppHeader() {
	const matches = useMatches();
	const { data: unreadCount } = useQuery({
		queryKey: notificationQueryKeys.unreadCount,
		queryFn: fetchUnreadCount,
		refetchInterval: 30_000,
	});

	const pageTitle = matches[matches.length - 1]?.staticData.title ?? "";

	return (
		<div className="w-full h-16 border-b flex items-center justify-between px-4 fixed bg-background">
			{/* Left Side */}
			<div className="flex gap-4 items-center">
				<SidebarTrigger />

				<div className="font-semibold">{pageTitle}</div>
			</div>

			{/* RIght Side */}
			<div className="flex items-center gap-2">
				<Link
					to="/notifications"
					className="relative inline-flex items-center justify-center rounded-full border p-2 transition hover:bg-muted"
				>
					<TbBell className="h-5 w-5" />
					{unreadCount ? (
						<Badge className="absolute -right-2 -top-1 h-5 min-w-[1.5rem] justify-center rounded-full bg-primary text-xs leading-none text-primary-foreground">
							{unreadCount > 99 ? "99+" : unreadCount}
						</Badge>
					) : null}
				</Link>
			</div>
		</div>
	);
}
