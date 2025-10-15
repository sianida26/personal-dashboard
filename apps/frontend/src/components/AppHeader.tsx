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
