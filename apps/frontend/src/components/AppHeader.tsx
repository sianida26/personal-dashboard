import { useState } from "react";
import {
	AppShell,
	Avatar,
	Burger,
	Group,
	Menu,
	UnstyledButton,
	Text,
	rem,
} from "@mantine/core";
import logo from "@/assets/logos/logo.png";
import cx from "clsx";
import classNames from "./styles/appHeader.module.css";
import { TbChevronDown } from "react-icons/tb";
// import getUserMenus from "../actions/getUserMenus";
// import { useAuth } from "@/modules/auth/contexts/AuthContext";
// import UserMenuItem from "./UserMenuItem";

interface Props {
	openNavbar: boolean;
	toggle: () => void;
}

// const mockUserData = {
// 	name: "Fulan bin Fulanah",
// 	email: "janspoon@fighter.dev",
// 	image: "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png",
// };

export default function AppHeader(props: Props) {
	const [userMenuOpened, setUserMenuOpened] = useState(false);

	// const { user } = useAuth();

	// const userMenus = getUserMenus().map((item, i) => (
	// 	<UserMenuItem item={item} key={i} />
	// ));

	return (
		<AppShell.Header>
			<Group h="100%" px="md" justify="space-between">
				<Burger
					opened={props.openNavbar}
					onClick={props.toggle}
					hiddenFrom="sm"
					size="sm"
				/>
				<img src={logo} alt="" className="h-8" />
				<Menu
					width={260}
					position="bottom-end"
					transitionProps={{ transition: "pop-top-right" }}
					onOpen={() => setUserMenuOpened(true)}
					onClose={() => setUserMenuOpened(false)}
					withinPortal
				>
					<Menu.Target>
						<UnstyledButton
							className={cx(classNames.user, {
								[classNames.userActive]: userMenuOpened,
							})}
						>
							<Group gap={7}>
								<Avatar
									// src={user?.photoProfile}
									// alt={user?.name}
									radius="xl"
									size={20}
								/>
								<Text fw={500} size="sm" lh={1} mr={3}>
									{/* {user?.name} */}
									Username
								</Text>
								<TbChevronDown
									style={{ width: rem(12), height: rem(12) }}
									strokeWidth={1.5}
								/>
							</Group>
						</UnstyledButton>
					</Menu.Target>

					<Menu.Dropdown>
						<Menu.Label>Settings</Menu.Label>

						{/* {userMenus} */}
					</Menu.Dropdown>
				</Menu>
			</Group>
		</AppShell.Header>
	);
}
