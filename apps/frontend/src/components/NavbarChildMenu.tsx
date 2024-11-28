// import classNames from "./styles/navbarChildMenu.module.css";
// import { SidebarMenu } from "backend/types";

// interface Props {
// 	item: NonNullable<SidebarMenu["children"]>[number];
// 	active: boolean;
// }

/**
 * `ChildMenu` is a React functional component that renders a child menu item.
 * It displays the item as a text link.
 *
 * @param props - The component props.
 * @param props.item - The child menu item data.
 * @returns A React element representing a child menu item.
 */
export default function ChildMenu() {
	// const linkPath = props.item.link.startsWith("/")
	// 	? props.item.link
	// 	: `/${props.item.link}`;

	return (
		// <Text<"a">
		// 	component="a"
		// 	className={classNames.link}
		// 	href={`${linkPath}`}
		// 	fw={props.active ? "bold" : "normal"}
		// >
		// 	{props.item.label}
		// </Text>
		<div>- NavbarChildMenu.tsx -</div>
	);
}
