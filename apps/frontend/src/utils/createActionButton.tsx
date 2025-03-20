import {
	type ButtonProps,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	buttonVariants,
} from "@repo/ui";
import { Link } from "@tanstack/react-router";
import type React from "react";
import { cn } from "@repo/ui/utils";

type Action = ButtonProps & {
	label: string;
	action?: (() => void) | string;
	permission?: boolean;
	icon: React.ReactNode;
	asLink?: boolean;
};

export default function createActionButtons(actions: Action[]) {
	const elements = actions.map((action) =>
		action.permission ? (
			<TooltipProvider key={action.label}>
				<Tooltip>
					<TooltipTrigger asChild>
						{typeof action.action === "string" ||
						action.action === undefined ? (
							<Link
								to={action.action ?? "#"}
								className={cn(
									buttonVariants({
										variant: action.variant,
										size: action.size ?? "icon",
										className: action.className,
									}),
								)}
							>
								{action.icon}
							</Link>
						) : (
							<button
								type="button"
								onClick={action.action}
								className={cn(
									buttonVariants({
										variant: action.variant,
										size: action.size ?? "icon",
										className: action.className,
									}),
								)}
							>
								{action.icon}
							</button>
						)}
					</TooltipTrigger>
					<TooltipContent>
						<p>{action.label}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		) : null,
	);

	return <>{elements}</>;
}
