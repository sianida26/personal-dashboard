import { useState } from "react";

import {
	Box,
	Collapse,
	Group,
	ThemeIcon,
	UnstyledButton,
	rem,
} from "@mantine/core";
import { TbChevronRight } from "react-icons/tb";
import * as TbIcons from "react-icons/tb";

import classNames from "./styles/navbarMenuItem.module.css";
// import dashboardConfig from "../dashboard.config";
// import { usePathname } from "next/navigation";
// import areURLsSame from "@/utils/areUrlSame";

import { SidebarMenu } from "backend/types";
import ChildMenu from "./NavbarChildMenu";
import { Link } from "@tanstack/react-router";

interface Props {
	menu: SidebarMenu;
}

//TODO: Make bold and collapsed when the item is active

/**
 * `MenuItem` is a React functional component that displays an individual menu item.
 * It can optionally include a collapsible sub-menu for items with children.
 *
 * @param props - The component props.
 * @param props.menu - The menu item data to display.
 * @returns A React element representing an individual menu item.
 */
export default function MenuItem({ menu }: Props) {
	const hasChildren = Array.isArray(menu.children);

	// const pathname = usePathname();

	const [opened, setOpened] = useState(
		// menu.children?.some((child) =>
		// 	areURLsSame(`${dashboardConfig.baseRoute}${child.link}`, pathname)
		// ) ?? false
		false
	);

	const toggleOpenMenu = () => {
		setOpened((prev) => !prev);
	};

	// Mapping children menu items if available
	const subItems = (hasChildren ? menu.children! : []).map((child, index) => (
		<ChildMenu key={index} item={child} active={false} />
	));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Icons = TbIcons as any;

	const Icon =
		typeof menu.icon.tb === "string" ? Icons[menu.icon.tb] : menu.icon.tb;

	// const isActive = areURLsSame(
	// 	`${dashboardConfig.baseRoute}${menu.link}`,
	// 	pathname
	// );

	return (
		<>
			{/* Main Menu Item */}
			<UnstyledButton<typeof Link | "button">
				onClick={toggleOpenMenu}
				className={`${classNames.control} py-2`}
				to={menu.link}
				component={menu.link ? Link : "button"}
			>
				<Group justify="space-between" gap={0}>
					{/* Icon and Label */}
					<Box style={{ display: "flex", alignItems: "center" }}>
						<ThemeIcon variant="light" size={30} color={menu.color}>
							<Icon style={{ width: rem(18), height: rem(18) }} />
						</ThemeIcon>

						<Box ml="md" fw={500}>
							{menu.label}
						</Box>
					</Box>

					{/* Chevron Icon for collapsible items */}
					{hasChildren && (
						<TbChevronRight
							strokeWidth={1.5}
							style={{
								width: rem(16),
								height: rem(16),
								transform: opened
									? "rotate(-90deg)"
									: "rotate(90deg)",
							}}
							className={classNames.chevron}
						/>
					)}
				</Group>
			</UnstyledButton>

			{/* Collapsible Sub-Menu */}
			{hasChildren && <Collapse in={opened}>{subItems}</Collapse>}
		</>
	);
}
