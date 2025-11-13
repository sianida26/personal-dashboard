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
import type { IconType } from "react-icons";
import { TbBell, TbChevronUp, TbDoorExit, TbUser } from "react-icons/tb";
import defaultProfilePicture from "@/assets/images/default-picture.jpg";
import logo from "@/assets/logos/logo.png";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import { getTablerIcon } from "@/utils/getTablerIcon";

export default function AppSidebar() {
	const { user } = useAuth();

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
	});

	const matchRoute = useMatchRoute();

	if (isLoading) {
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

	if (error) {
		return (
			<Sidebar>
				<SidebarHeader />
				<SidebarContent>
					<p>Error loading sidebar</p>
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
								<SidebarGroupLabel>
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
																<Icon className="mr-2" />
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
										{Icon && <Icon className="mr-2" />}
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
								<SidebarMenuButton className="h-16 rounded-sm border pl-2 flex w-full items-center justify-between">
									{/* Left Side */}
									<div className="flex overflow-clip items-center gap-2 w-full">
										<img
											src={defaultProfilePicture}
											alt="User avatar"
											className="h-12 rounded-xl"
										/>

										<div className="flex flex-col w-full text-sm overflow-hidden">
											<p className="w-full truncate font-semibold">
												{user?.name}
											</p>
											<p className="w-full text-xs truncate text-muted-foreground">
												{user?.email ??
													user?.username ??
													"User"}
											</p>
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
								className="w-(--radix-popper-anchor-width)"
							>
								<DropdownMenuItem>
									<span className="flex items-center gap-2">
										<TbUser /> Account
									</span>
								</DropdownMenuItem>
								<Link to="/personal/notifications">
									<DropdownMenuItem>
										<span className="flex items-center gap-2">
											<TbBell /> Notification
										</span>
									</DropdownMenuItem>
								</Link>
								<Link to="/logout">
									<DropdownMenuItem>
										<span className="flex items-center gap-2 text-red-500">
											<TbDoorExit /> Sign Out
										</span>
									</DropdownMenuItem>
								</Link>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
