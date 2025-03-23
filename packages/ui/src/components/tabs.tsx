"use client";

import * as React from "react";
import { cn } from "../utils";

/**
 * Tabs Component
 *
 * A flexible tabs component inspired by Mantine's implementation that allows users
 * to switch between different sections of content within the same space.
 *
 * Features:
 * - Keyboard navigation (arrow keys, home, end)
 * - Customizable appearance through className props
 * - Support for disabled tabs
 * - Controlled and uncontrolled modes
 * - Orientation support (horizontal/vertical)
 */

type TabsContextValue = {
	activeTab: string;
	onTabChange: (value: string) => void;
	orientation: "horizontal" | "vertical";
	loop: boolean;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
	const context = React.useContext(TabsContext);
	if (!context) {
		throw new Error("Tabs components must be used within a Tabs provider");
	}
	return context;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Default value for uncontrolled component */
	defaultValue?: string;
	/** Current active tab value (controlled component) */
	value?: string;
	/** Called when tab changes */
	onValueChange?: (value: string) => void;
	/** Tabs orientation, horizontal by default */
	orientation?: "horizontal" | "vertical";
	/** Whether keyboard navigation should loop from last tab to first and vice versa */
	loop?: boolean;
	/** Optional classnames for different parts of the component */
	classNames?: {
		root?: string;
		tabList?: string;
		tab?: string;
		panel?: string;
	};
	/** Children must be Tab.List and Tab.Panel components */
	children: React.ReactNode;
}

const Tabs = ({
	defaultValue,
	value,
	onValueChange,
	orientation = "horizontal",
	loop = true,
	className,
	classNames,
	children,
	...props
}: TabsProps) => {
	const [activeTab, setActiveTab] = React.useState(
		value ?? defaultValue ?? "",
	);

	// Update internal state when controlled value changes
	React.useEffect(() => {
		if (value !== undefined) {
			setActiveTab(value);
		}
	}, [value]);

	const handleTabChange = React.useCallback(
		(newValue: string) => {
			if (value === undefined) {
				setActiveTab(newValue);
			}
			onValueChange?.(newValue);
		},
		[onValueChange, value],
	);

	const contextValue = React.useMemo(
		() => ({
			activeTab,
			onTabChange: handleTabChange,
			orientation,
			loop,
		}),
		[activeTab, handleTabChange, orientation, loop],
	);

	return (
		<TabsContext.Provider value={contextValue}>
			<div
				className={cn(
					"tabs w-full",
					orientation === "vertical" && "tabs-vertical",
					className,
					classNames?.root,
				)}
				{...props}
			>
				{children}
			</div>
		</TabsContext.Provider>
	);
};

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

/**
 * Container for tab triggers
 */
const TabList = ({ className, children, ...props }: TabListProps) => {
	const { orientation } = useTabsContext();

	return (
		<div
			className={cn(
				"flex w-full h-10 items-center justify-start gap-4 border-b border-border",
				orientation === "vertical" && "flex-col",
				className,
			)}
			role="tablist"
			aria-orientation={orientation}
			{...props}
		>
			{children}
		</div>
	);
};

interface TabTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** Value of the tab that this trigger activates */
	value: string;
	/** Whether the tab is disabled */
	disabled?: boolean;
	/** Icon to display before label */
	icon?: React.ReactNode;
	/** Icon to display after label */
	rightIcon?: React.ReactNode;
}

/**
 * Clickable tab trigger that activates its corresponding panel
 */
const TabTrigger = ({
	className,
	value,
	disabled = false,
	icon,
	rightIcon,
	children,
	...props
}: TabTriggerProps) => {
	const { activeTab, onTabChange, orientation, loop } = useTabsContext();
	const isActive = activeTab === value;
	const triggerRef = React.useRef<HTMLButtonElement>(null);

	// Keyboard navigation handler
	const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
		if (disabled) return;

		// Check keyboard navigation keys
		const isHorizontal = orientation === "horizontal";
		const isVertical = orientation === "vertical";

		let direction: "prev" | "next" | "first" | "last" | null = null;

		// Determine navigation direction based on key and orientation
		switch (event.key) {
			case "ArrowRight":
				if (isHorizontal) direction = "next";
				break;
			case "ArrowLeft":
				if (isHorizontal) direction = "prev";
				break;
			case "ArrowDown":
				if (isVertical) direction = "next";
				break;
			case "ArrowUp":
				if (isVertical) direction = "prev";
				break;
			case "Home":
				direction = "first";
				break;
			case "End":
				direction = "last";
				break;
			default:
				return; // Not a navigation key, return early
		}

		// If we have a direction to navigate, prevent default behavior
		if (direction) {
			event.preventDefault();

			// Find the parent element (tab list)
			const parent = triggerRef.current?.parentElement;
			if (!parent) return;

			// Get all tab buttons that aren't disabled
			const tabs = Array.from(
				parent.querySelectorAll<HTMLButtonElement>(
					'button[role="tab"]:not([disabled])',
				),
			);

			// Find current tab index
			const currentIndex = tabs.findIndex(
				(tab) => tab === triggerRef.current,
			);
			if (currentIndex === -1) return;

			// Determine target index based on direction
			let targetIndex: number;

			switch (direction) {
				case "prev":
					targetIndex = currentIndex - 1;
					if (targetIndex < 0 && loop) targetIndex = tabs.length - 1;
					break;
				case "next":
					targetIndex = currentIndex + 1;
					if (targetIndex >= tabs.length && loop) targetIndex = 0;
					break;
				case "first":
					targetIndex = 0;
					break;
				case "last":
					targetIndex = tabs.length - 1;
					break;
			}

			// If target index is in range, focus and activate it
			if (targetIndex >= 0 && targetIndex < tabs.length) {
				const targetTab = tabs[targetIndex];

				// Check that the tab element exists before using it
				if (targetTab) {
					targetTab.focus();

					// Extract value from the target tab
					const tabValue = targetTab.getAttribute("data-value");
					if (tabValue) {
						onTabChange(tabValue);
					}
				}
			}
		}
	};

	const handleClick = () => {
		if (!disabled) {
			onTabChange(value);
		}
	};

	return (
		<button
			ref={triggerRef}
			role="tab"
			aria-selected={isActive}
			aria-controls={`panel-${value}`}
			id={`tab-${value}`}
			tabIndex={isActive ? 0 : -1}
			data-value={value}
			className={cn(
				"inline-flex h-10 w-full items-center justify-center whitespace-nowrap px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
				isActive
					? "border-b-2 border-foreground text-foreground"
					: "text-muted-foreground hover:text-foreground",
				className,
			)}
			disabled={disabled}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...props}
		>
			{icon && <span className="mr-2">{icon}</span>}
			{children}
			{rightIcon && <span className="ml-2">{rightIcon}</span>}
		</button>
	);
};

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Value of the tab that shows this panel */
	value: string;
	/** Panel content */
	children: React.ReactNode;
}

/**
 * Content panel that is shown when its corresponding trigger is active
 */
const TabPanel = ({ className, value, children, ...props }: TabPanelProps) => {
	const { activeTab } = useTabsContext();
	const isActive = activeTab === value;

	if (!isActive) return null;

	return (
		<div
			role="tabpanel"
			id={`panel-${value}`}
			aria-labelledby={`tab-${value}`}
			className={cn(
				"mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

// Attach components to namespace
Tabs.List = TabList;
Tabs.Trigger = TabTrigger;
Tabs.Panel = TabPanel;

export { Tabs, TabList, TabTrigger, TabPanel };
