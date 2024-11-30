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
import { useMatchRoute } from "@tanstack/react-router";

export default function AppSidebar() {
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
			<SidebarHeader>
				<div className="pb-4 flex justify-center">
					<img src={logo} alt="Logo" />
				</div>
			</SidebarHeader>
			<SidebarContent>
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
															<a
																href={
																	child.link
																}
															>
																{Icon && (
																	<Icon className="mr-2" />
																)}
																<span>
																	{
																		child.label
																	}
																</span>
															</a>
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
										<a href={menu.link}>
											{Icon && <Icon className="mr-2" />}
											<span>{menu.label}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						);
					}
				})}
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
