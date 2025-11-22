/**
 * Breadcrumbs Component
 *
 * A navigation aid that helps users understand their location within a website or application's hierarchy.
 * Displays a trail of links, with the current page being the last item in the trail.
 *
 * Features:
 * - Customizable separator between items
 * - Last item styled differently to indicate current page
 * - Fully responsive with flex-wrap layout
 * - Completely stylable via className props
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Breadcrumbs>
 *   <a href="/">Home</a>
 *   <a href="/dashboard">Dashboard</a>
 *   <span>Settings</span>
 * </Breadcrumbs>
 *
 * // Custom separator
 * <Breadcrumbs separator="→">
 *   <a href="/">Home</a>
 *   <a href="/settings">Settings</a>
 * </Breadcrumbs>
 *
 * // With custom styling
 * <Breadcrumbs
 *   className="p-2 bg-slate-100 rounded"
 *   separatorClassName="mx-4 text-blue-500"
 * >
 *   <a href="/">Home</a>
 *   <a href="/settings">Settings</a>
 * </Breadcrumbs>
 * ```
 */

import * as React from "react";
import { cn } from "../utils";

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Separator element between breadcrumbs items */
	separator?: React.ReactNode;
	/** Class name to apply to the separator element */
	classNames?: Partial<{
		separator: string;
		item: string;
	}>;
	/** Breadcrumb children, typically an array of links or text elements */
	children: React.ReactNode;
}

const Breadcrumbs = React.forwardRef<HTMLDivElement, BreadcrumbsProps>(
	({ separator = "/", classNames, className, children, ...props }, ref) => {
		const _children = React.Children.toArray(children).filter(Boolean);

		const items = _children.map((child, index) => {
			const isLast = index === _children.length - 1;
			const key =
				(child as React.ReactElement)?.key ||
				`breadcrumb-item-${index}`;
			return (
				<div
					key={key}
					className={cn(
						"flex items-center",
						classNames?.item,
						isLast
							? "text-foreground font-medium"
							: "text-muted-foreground",
					)}
				>
					{child}
					{!isLast && (
						<span
							className={cn(
								"flex items-center text-muted-foreground mx-2",
								classNames?.separator,
							)}
						>
							{separator}
						</span>
					)}
				</div>
			);
		});

		return (
			<div
				ref={ref}
				className={cn("flex items-center flex-wrap", className)}
				{...props}
			>
				{items}
			</div>
		);
	},
);

Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };
