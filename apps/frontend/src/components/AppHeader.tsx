import { Badge, SidebarTrigger } from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useMatches } from "@tanstack/react-router";
import { TbBell } from "react-icons/tb";
import ProfileMenu from "@/components/ProfileMenu";
import { fetchUnreadCount } from "@/modules/notifications/api";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";

export default function AppHeader() {
	const matches = useMatches();
	const { data: unreadCount } = useQuery({
		queryKey: notificationQueryKeys.unreadCount,
		queryFn: fetchUnreadCount,
		refetchInterval: 30_000,
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

				{/* Profile Menu - Always accessible even when sidebar fails */}
				<ProfileMenu />
			</div>
		</div>
	);
}
