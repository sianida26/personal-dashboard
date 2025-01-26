import { type ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import * as React from "react";

const NativePagination = ({
	className,
	...props
}: React.ComponentProps<"nav">) => (
	<nav
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
);
NativePagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		className={cn("flex flex-row items-center gap-1", className)}
		{...props}
	/>
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<"a">;

const PaginationLink = ({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) => (
	<a
		aria-current={isActive ? "page" : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? "outline" : "ghost",
				size,
			}),
			className,
		)}
		{...props}
	/>
);
PaginationLink.displayName = "PaginationLink";

type PaginationButtonProps = {
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<"button">;

const PaginationButton = ({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationButtonProps) => (
	<button
		aria-current={isActive ? "page" : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? "outline" : "ghost",
				size,
			}),
			className,
		)}
		{...props}
	/>
);
PaginationButton.displayName = "PaginationButton";

const PaginationPrevious = ({
	className,
	...props
}: React.ComponentProps<typeof PaginationButton>) => (
	<PaginationButton
		aria-label="Go to previous page"
		size="default"
		className={cn("gap-1 pl-2.5", className)}
		{...props}
	>
		<ChevronLeftIcon className="h-4 w-4" />
		<span>Previous</span>
	</PaginationButton>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
	className,
	...props
}: React.ComponentProps<typeof PaginationButton>) => (
	<PaginationButton
		aria-label="Go to next page"
		size="default"
		className={cn("gap-1 pr-2.5", className)}
		{...props}
	>
		<span>Next</span>
		<ChevronRightIcon className="h-4 w-4" />
	</PaginationButton>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
	className,
	...props
}: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...props}
	>
		<DotsHorizontalIcon className="h-4 w-4" />
		<span className="sr-only">More pages</span>
	</span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export type PaginationProps = {
	boundaries?: number;
	className?: string;
	onChange?: (value: number) => void;
	siblings?: number;
	total: number;
	value?: number;
};

const Pagination = ({
	boundaries = 1,
	className,
	onChange,
	siblings = 1,
	total,
	value = 1,
}: PaginationProps) => {
	const getPageNumbers = () => {
		// If total pages is small, just show all pages
		if (total <= boundaries * 2 + siblings * 2 + 1) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const pages: (number | "dots")[] = [];

		const rightBoundary = total - boundaries + 1;
		const leftSibling = Math.max(value - siblings, boundaries + 1);
		const rightSibling = Math.min(value + siblings, rightBoundary - 1);

		// Add first boundaries
		for (let i = 1; i <= boundaries; i++) {
			pages.push(i);
		}

		// Add left dots if needed
		if (leftSibling > boundaries + 1) {
			pages.push("dots");
		}

		// Add siblings and current page
		for (let i = leftSibling; i <= rightSibling; i++) {
			if (i > boundaries && i < rightBoundary) {
				pages.push(i);
			}
		}

		// Add right dots if needed
		if (rightSibling < rightBoundary - 1) {
			pages.push("dots");
		}

		// Add last boundaries
		for (let i = rightBoundary; i <= total; i++) {
			pages.push(i);
		}

		return pages;
	};

	return (
		<NativePagination className={className}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => onChange?.(Math.max(1, value - 1))}
						disabled={value <= 1}
					/>
				</PaginationItem>
				{getPageNumbers().map((page) => (
					<PaginationItem
						key={page === "dots" ? `dots-${Math.random()}` : page}
					>
						{page === "dots" ? (
							<PaginationEllipsis />
						) : (
							<PaginationButton
								isActive={page === value}
								onClick={() => onChange?.(page)}
							>
								{page}
							</PaginationButton>
						)}
					</PaginationItem>
				))}
				<PaginationItem>
					<PaginationNext
						onClick={() => onChange?.(Math.min(total, value + 1))}
						disabled={value >= total}
					/>
				</PaginationItem>
			</PaginationContent>
		</NativePagination>
	);
};

export {
	Pagination,
	NativePagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
	PaginationButton,
};
