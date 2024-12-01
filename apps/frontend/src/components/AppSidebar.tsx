// src/components/AppSidebar.tsx
import {
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
} from "./ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import client from "@/honoClient";
import { SidebarMenu as SidebarMenuType } from "backend/types";
import { getTablerIcon } from "@/utils/getTablerIcon";
import { IconType } from "react-icons";

import logo from "@/assets/logos/logo.png";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { TbChevronUp, TbDoorExit, TbUser } from "react-icons/tb";
import useAuth from "@/hooks/useAuth";
import { DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import defaultProfilePicture from "@/assets/images/default-picture.jpg";

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
					<p>Loading...</p>
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
					<img src={logo} alt="Logo" />
				</div>
			</SidebarHeader>
			<SidebarContent className="pt-4">
				{data?.map((menu, index) => {
					if (menu.type === "group") {
						return (
							<SidebarGroup key={index}>
								<SidebarGroupLabel>
									{menu.label}
								</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{menu.children.map(
											(child, childIndex) => {
												const Icon: IconType | null =
													child.icon
														? getTablerIcon(
																child.icon.tb
															)
														: null;

												return (
													<SidebarMenuItem
														key={childIndex}
													>
														<SidebarMenuButton
															asChild
															isActive={Boolean(
																matchRoute({
																	to: child.link,
																})
															)}
														>
															<Link
																to={child.link}
															>
																{Icon && (
																	<Icon className="mr-2" />
																)}
																<span>
																	{
																		child.label
																	}
																</span>
															</Link>
														</SidebarMenuButton>
													</SidebarMenuItem>
												);
											}
										)}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						);
					} else {
						// Single SidebarMenuItem (not in a group)
						const Icon: IconType | null = menu.icon
							? getTablerIcon(menu.icon.tb)
							: null;

						return (
							<SidebarMenu key={index}>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={Boolean(
											matchRoute({
												to: menu.link,
											})
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
					}
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
											alt="Profile Picture"
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
								className="w-[--radix-popper-anchor-width]"
							>
								<DropdownMenuItem>
									<span className="flex items-center gap-2">
										<TbUser /> Account
									</span>
								</DropdownMenuItem>
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
