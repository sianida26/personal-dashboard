import {
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
		<Sidebar>
			<SidebarHeader className="h-16">
				<div className="flex justify-center items-center">
					<img src={logo} alt="Logo" className="h-14" />
				</div>
			</SidebarHeader>
			<SidebarContent className="pt-4">
				{data?.map((menu) => {
					if (menu.type === "group") {
						return (
							<SidebarGroup key={menu.label}>
								<SidebarGroupLabel className="text-primary">
									{menu.label}
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
													>
														<Link to={child.link}>
															{Icon && (
																<Icon className="mr-2 text-primary" />
															)}
															<span>
																{child.label}
															</span>
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
									size="lg"
								>
									<Link to={menu.link}>
										{Icon && (
											<Icon className="mr-2 text-primary" />
										)}
										<span>{menu.label}</span>
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
											className="h-12 rounded-xl ring-2 ring-primary/20"
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
								className="w-56 dropdown-themed"
							>
								<div className="flex items-center gap-2 p-2">
									<img
										src={defaultProfilePicture}
										alt="User avatar"
										className="h-10 w-10 rounded-full"
									/>
									<div className="flex flex-col">
										<span className="text-sm font-semibold">
											{user?.name}
										</span>
										{(user?.email || user?.username) && (
											<span className="text-xs text-muted-foreground">
												{user.email ?? user.username}
											</span>
										)}
									</div>
								</div>
								<DropdownMenuItem>
									<TbUser className="mr-2 h-4 w-4" />
									<span>Account</span>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/personal/notifications"
										className="cursor-pointer"
									>
										<TbBell className="mr-2 h-4 w-4" />
										<span>Notifications</span>
									</Link>
								</DropdownMenuItem>
								<ThemeSettings>
									<TbPalette className="mr-2 h-4 w-4" />
									<span>Theme</span>
								</ThemeSettings>
								<DropdownMenuItem asChild>
									<Link
										to="/logout"
										className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
									>
										<TbDoorExit className="mr-2 h-4 w-4" />
										<span>Sign Out</span>
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
