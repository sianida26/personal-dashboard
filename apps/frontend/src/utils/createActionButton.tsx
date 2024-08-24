import {
	ActionIcon,
	ActionIconVariant,
	MantineColor,
	Tooltip,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import React from "react";

interface Action {
	label: string;
	action?: () => void | string;
	variant?: ActionIconVariant;
	permission?: boolean;
	icon: React.ReactNode;
	color: MantineColor;
}

export default function createActionButtons(actions: Action[]) {
	const defaults = {
		variant: "light",
	};

	const elements = actions.map((action, i) =>
		action.permission ? (
			<Tooltip label={action.label} key={i}>
				{typeof action.action === "string" ||
				action.action === undefined ? (
					<ActionIcon
						variant={action.variant ?? defaults.variant}
						color={action.color}
						component={Link}
						to={action.action ?? "#"}
					>
						{action.icon}
					</ActionIcon>
				) : (
					<ActionIcon
						variant={action.variant ?? defaults.variant}
						color={action.color}
						onClick={action.action}
					>
						{action.icon}
					</ActionIcon>
				)}
			</Tooltip>
		) : null
	);

	return <>{elements}</>;
}
