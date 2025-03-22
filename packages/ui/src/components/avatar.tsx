import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../utils";

const avatarVariants = cva(
	"inline-flex items-center justify-center overflow-hidden rounded-full select-none shrink-0",
	{
		variants: {
			size: {
				xs: "h-6 w-6 text-xs",
				sm: "h-8 w-8 text-sm",
				md: "h-10 w-10 text-base",
				lg: "h-12 w-12 text-lg",
				xl: "h-16 w-16 text-xl",
			},
			variant: {
				default: "bg-muted text-muted-foreground",
				primary: "bg-primary text-primary-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				outline: "bg-background border border-input",
			},
			radius: {
				xs: "rounded-sm",
				sm: "rounded",
				md: "rounded-md",
				lg: "rounded-lg",
				xl: "rounded-xl",
				full: "rounded-full",
			},
		},
		defaultVariants: {
			size: "md",
			variant: "default",
			radius: "full",
		},
	},
);

export interface AvatarProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof avatarVariants> {
	src?: string;
	alt?: string;
	color?: string;
	children?: React.ReactNode;
	fallback?: React.ReactNode;
}

const getFallbackInitials = (name?: string) => {
	if (!name) return "";

	const nameParts = name.split(" ");
	if (nameParts.length === 1) {
		return nameParts[0]?.charAt(0)?.toUpperCase() || "";
	}

	return (
		(nameParts[0]?.charAt(0) || "") +
		(nameParts[nameParts.length - 1]?.charAt(0) || "")
	).toUpperCase();
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
	(
		{
			className,
			src,
			alt,
			size,
			variant,
			radius,
			color,
			children,
			fallback,
			style,
			...props
		},
		ref,
	) => {
		const [hasError, setHasError] = React.useState(false);
		const customStyles = color
			? { backgroundColor: color, ...style }
			: style;

		const handleError = () => {
			setHasError(true);
		};

		const renderContent = () => {
			// If children are provided, render them directly
			if (children) {
				return children;
			}

			// If image source is provided and no error loading image
			if (src && !hasError) {
				return (
					<img
						src={src}
						alt={alt ?? "Avatar"}
						className="h-full w-full object-cover"
						onError={handleError}
					/>
				);
			}

			// If custom fallback is provided
			if (fallback) {
				return fallback;
			}

			// Default fallback shows initials
			return <span>{getFallbackInitials(alt)}</span>;
		};

		return (
			<div
				ref={ref}
				className={cn(
					avatarVariants({ size, variant, radius, className }),
				)}
				style={customStyles}
				{...props}
			>
				{renderContent()}
			</div>
		);
	},
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	spacing?: number;
	limit?: number;
	total?: number;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
	({ className, children, spacing = -8, limit, total, ...props }, ref) => {
		const childrenArray = React.Children.toArray(children);
		const visibleAvatars = limit
			? childrenArray.slice(0, limit)
			: childrenArray;
		const excess = total ?? (limit ? childrenArray.length - limit : 0);

		return (
			<div
				ref={ref}
				className={cn("flex", className)}
				style={{ marginLeft: `${Math.abs(spacing)}px` }}
				{...props}
			>
				{visibleAvatars.map((child, index) => (
					<div
						key={
							React.isValidElement(child)
								? (child.key ?? `avatar-${index}`)
								: `avatar-${index}`
						}
						style={{ marginLeft: index === 0 ? 0 : spacing }}
						className="relative"
					>
						{child}
					</div>
				))}
				{excess > 0 && (
					<div style={{ marginLeft: spacing }} className="relative">
						<Avatar variant="secondary">+{excess}</Avatar>
					</div>
				)}
			</div>
		);
	},
);

AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup, avatarVariants }; 