import {
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	LoadingSpinner,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useMatchRoute } from "@tanstack/react-router";
import type { SidebarMenu as SidebarMenuType } from "backend/types";
import { useEffect, useRef } from "react";
import type { IconType } from "react-icons";
import {
	TbBell,
	TbChevronUp,
	TbDoorExit,
	TbPalette,
	TbUser,
} from "react-icons/tb";
import { toast } from "sonner";
import defaultProfilePicture from "@/assets/images/default-picture.jpg";
import logo from "@/assets/logos/logo.png";
import { ThemeSettings } from "@/components/ThemeSettings";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import { getTablerIcon } from "@/utils/getTablerIcon";

export default function AppSidebar() {
	const { user } = useAuth();
	const hasShownErrorRef = useRef(false);

	const { data, isLoading, error } = useQuery<SidebarMenuType[], Error>({
		queryKey: ["sidebarData"],
		queryFn: async () => {
			const res = await client.dashboard.getSidebarItems.$get();

			if (res.ok) {
				const data: SidebarMenuType[] = await res.json();
				return data;
			}

			console.error(`Error: ${res.status} ${res.statusText}`);
			throw new Error("Error fetching sidebar data");
		},
		// Keep previous data while refetching
		placeholderData: (previousData) => previousData,
		// Retry on network errors but not on 4xx/5xx responses
		retry: (failureCount, error) => {
			if (failureCount >= 3) return false;
			const isNetworkError =
				error.message.includes("NetworkError") ||
				error.message.includes("Failed to fetch") ||
				error.message.includes("Network request failed");
			return isNetworkError;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
	});

	// Show toast notification on error, but only once
	useEffect(() => {
		if (error && !hasShownErrorRef.current) {
			hasShownErrorRef.current = true;
			toast.error("Can't load menu", {
				description:
					"Having trouble connecting to the server. Using cached menu if available.",
				duration: 5000,
			});
		} else if (!error && hasShownErrorRef.current) {
			// Reset when error is resolved
			hasShownErrorRef.current = false;
		}
	}, [error]);

	const matchRoute = useMatchRoute();

	// Show loading only on initial load (no data yet)
	if (isLoading && !data) {
		return (
			<Sidebar>
				<SidebarHeader />
				<SidebarContent>
					<div className="flex h-screen w-screen items-center justify-center rounded-lg border bg-card">
						<LoadingSpinner />
					</div>
				</SidebarContent>
				<SidebarFooter />
			</Sidebar>
		);
	}

	// If error and no cached data, show minimal sidebar with logout
	if (error && !data) {
		return (
			<Sidebar>
				<SidebarHeader className="h-16">
					<div className="flex justify-center items-center">
						<img src={logo} alt="Logo" className="h-14" />
					</div>
				</SidebarHeader>
				<SidebarContent className="pt-4">
					<div className="flex flex-col items-center justify-center gap-4 px-4 py-8 text-center">
						<div className="text-sm font-semibold text-muted-foreground">
							Menu unavailable
						</div>
						<p className="text-xs text-muted-foreground">
							Server connection issue. Retrying automatically...
						</p>
					</div>
				</SidebarContent>
				<SidebarFooter />
			</Sidebar>
		);
	}

	return (
		<Sidebar className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
			<SidebarHeader className="h-16 bg-white dark:bg-gray-900">
				<div className="flex justify-center items-center">
					<img src={logo} alt="Logo" className="h-14" />
				</div>
			</SidebarHeader>
			<SidebarContent className="pt-4 bg-white dark:bg-gray-900">
				{data?.map((menu) => {
					if (menu.type === "group") {
						return (
							<SidebarGroup key={menu.label}>
								<SidebarGroupLabel className="text-primary flex justify-between">
									<span>{menu.label}</span>
									{menu.badge && (
										<Badge
											className={`text-[10px] py-0 px-2 ${
												menu.badge.toLowerCase() ===
												"dev"
													? "bg-red-400"
													: menu.badge.toLowerCase() ===
															"beta"
														? "bg-amber-500"
														: "bg-primary/80"
											}`}
										>
											{menu.badge}
										</Badge>
									)}
								</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{menu.children.map((child) => {
											const Icon: IconType | null =
												child.icon
													? getTablerIcon(
															child.icon.tb,
														)
													: null;

											return (
												<SidebarMenuItem
													key={child.link}
												>
													<SidebarMenuButton
														asChild
														isActive={Boolean(
															matchRoute({
																to: child.link,
															}),
														)}
														className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary rounded-full w-11/12 hover:bg-primary"
													>
														<Link to={child.link}>
															{Icon && (
																<Icon className="mr-2 text-primary flex-shrink-0" />
															)}
															<div className="flex-1 min-w-0 flex items-center justify-between">
																<span className="truncate text-primary/80">
																	{
																		child.label
																	}{" "}
																</span>
																{child.badge && (
																	<Badge
																		className={`text-[10px] py-0 px-2 ml-2 ${
																			child.badge.toLowerCase() ===
																			"dev"
																				? "bg-red-400"
																				: child.badge.toLowerCase() ===
																						"beta"
																					? "bg-amber-500"
																					: "bg-primary/80"
																		}`}
																	>
																		{
																			child.badge
																		}
																	</Badge>
																)}
															</div>
														</Link>
													</SidebarMenuButton>
												</SidebarMenuItem>
											);
										})}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						);
					}
					// Single SidebarMenuItem (not in a group)
					const Icon: IconType | null = menu.icon
						? getTablerIcon(menu.icon.tb)
						: null;

					return (
						<SidebarMenu key={menu.link}>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={Boolean(
										matchRoute({
											to: menu.link,
										}),
									)}
									className="data-[active=true]:bg-primary/20 data-[active=true]:text-primary rounded-full w-11/12 hover:bg-primary"
								>
									<Link to={menu.link}>
										{Icon && (
											<Icon className="mr-2 text-primary" />
										)}
										<span className="text-primary/80">
											{menu.label}
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					);
				})}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild className="">
								<SidebarMenuButton
									className="h-16 rounded-lg border pl-2 flex w-full items-center justify-between transition-all duration-200 hover:shadow-[0_0_8px_0_hsl(var(--primary)_/_0.15)] focus:border-none focus:ring-none focus:ring-primary/20"
									style={{
										borderColor:
											"hsl(var(--primary) / 0.2)",
									}}
								>
									{/* Left Side */}
									<div className="flex overflow-clip items-center gap-2 w-full">
										<img
											src={defaultProfilePicture}
											alt="User avatar"
											className="h-12 rounded-full ring-2 ring-primary/20"
										/>

										<div className="flex flex-col w-full text-sm overflow-hidden">
											<p className="w-full truncate font-semibold">
												{user?.name}
											</p>
											{(user?.email ||
												user?.username) && (
												<p className="w-full text-xs truncate text-muted-foreground">
													{user.email ??
														user.username}
												</p>
											)}
										</div>
									</div>

									{/* Right Side */}
									<div className="">
										<TbChevronUp />
									</div>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="top"
								align="start"
								sideOffset={8}
								className="sidebar-dropdown-content w-64 md:w-58"
							>
								<div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-b border-primary/20">
									<div className="flex items-center space-x-3">
										<div className="relative">
											<img
												src={
													user?.profilePictureUrl ||
													defaultProfilePicture
												}
												alt="Profile"
												className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
											/>
											<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-white dark:border-gray-800 rounded-full" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
												{user?.name || "User"}
											</p>
											<p className="text-xs text-primary font-medium truncate">
												{user?.email ||
													"user@example.com"}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
												@{user?.username || "username"}
											</p>
										</div>
									</div>

									{user?.roles && user.roles.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											{user.roles
												.slice(0, 2)
												.map((role) => (
													<span
														key={role}
														className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
													>
														{role}
													</span>
												))}
											{user.roles.length > 2 && (
												<span className="text-xs text-gray-500 dark:text-gray-400">
													+{user.roles.length - 2}{" "}
													more
												</span>
											)}
										</div>
									)}
								</div>

								<DropdownMenuItem asChild>
									<Link
										// biome-ignore lint/suspicious/noExplicitAny: <>
										to={"/personal-data" as any}
										className="dropdown-item"
									>
										<TbUser className="h-4 w-4" />
										<span>Personal</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/personal/notifications"
										className="dropdown-item"
									>
										<TbBell className="h-4 w-4" />
										<span>Notifications</span>
									</Link>
								</DropdownMenuItem>
								<ThemeSettings>
									<TbPalette className="h-4 w-4 ms-2" />
									<span>Theme</span>
								</ThemeSettings>
								<DropdownMenuItem asChild>
									<Link
										to="/logout"
										className="dropdown-item dropdown-item-danger"
									>
										<TbDoorExit className="h-4 w-4" />
										<span>Logout</span>
									</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
