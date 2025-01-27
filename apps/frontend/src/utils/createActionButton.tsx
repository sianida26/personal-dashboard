import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@tanstack/react-router";
import type React from "react";

type Action = ButtonProps & {
	label: string;
	action?: (() => void) | string;
	permission?: boolean;
	icon: React.ReactNode;
};

export default function createActionButtons(actions: Action[]) {
	const elements = actions.map((action) =>
		action.permission ? (
			<TooltipProvider key={action.label}>
				<Tooltip>
					<TooltipTrigger>
						{typeof action.action === "string" ||
						action.action === undefined ? (
							<Link to={action.action ?? "#"}>
								<Button size="icon" {...action}>
									{action.icon}
								</Button>
							</Link>
						) : (
							<Button
								onClick={action.action}
								size="icon"
								{...action}
							>
								{action.icon}
							</Button>
						)}
					</TooltipTrigger>
					<TooltipContent className="">
						<p>{action.label}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		) : null,
	);

	return <>{elements}</>;
}
