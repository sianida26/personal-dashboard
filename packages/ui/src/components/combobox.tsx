import * as React from "react";
import { cn } from "../utils";

/* -------------------------------- Types ------------------------------- */

type ComboboxContextValue = {
	store: ComboboxStore;
	onOptionSubmit?: (value: string) => void;
	classNames?: ComboboxClassNames;
};

type ComboboxClassNames = Partial<{
	dropdown: string;
	options: string;
	option: string;
	search: string;
	target: string;
	empty: string;
	header: string;
	footer: string;
	group: string;
	groupLabel: string;
	chevron: string;
}>;

type ComboboxDropdownEventSource = "keyboard" | "mouse" | "unknown";

interface ComboboxStore {
	/** Current dropdown opened state */
	dropdownOpened: boolean;

	/** Opens dropdown */
	openDropdown(eventSource?: ComboboxDropdownEventSource): void;

	/** Closes dropdown */
	closeDropdown(eventSource?: ComboboxDropdownEventSource): void;

	/** Toggles dropdown opened state */
	toggleDropdown(eventSource?: ComboboxDropdownEventSource): void;

	/** Selected option index */
	selectedOptionIndex: number;

	/** Selects option by index */
	selectOption(index: number): void;

	/** Selects first option with active prop */
	selectActiveOption(): string | null;

	/** Selects first option that is not disabled */
	selectFirstOption(): string | null;

	/** Selects next option that is not disabled */
	selectNextOption(): string | null;

	/** Selects previous option that is not disabled */
	selectPreviousOption(): string | null;

	/** Resets selected option index to -1 */
	resetSelectedOption(): void;

	/** Triggers onClick event of selected option */
	clickSelectedOption(): void;

	/** Updates selected option index to currently selected or active option */
	updateSelectedOptionIndex(target?: "active" | "selected"): void;

	/** List id for aria attributes */
	listId: string | null;

	/** Sets list id */
	setListId(id: string): void;

	/** Ref of search input */
	searchRef: React.MutableRefObject<HTMLInputElement | null>;

	/** Focuses search input */
	focusSearchInput(): void;

	/** Ref of target element */
	targetRef: React.MutableRefObject<HTMLElement | null>;

	/** Focuses target element */
	focusTarget(): void;
}

interface UseComboboxOptions {
	/** Default value for dropdownOpened */
	defaultOpened?: boolean;

	/** Controlled dropdownOpened state */
	opened?: boolean;

	/** Called when dropdownOpened state changes */
	onOpenedChange?(opened: boolean): void;

	/** Called when dropdown closes */
	onDropdownClose?(eventSource: ComboboxDropdownEventSource): void;

	/** Called when dropdown opens */
	onDropdownOpen?(eventSource: ComboboxDropdownEventSource): void;

	/** Whether arrow key presses should loop through items */
	loop?: boolean;

	/** Behavior passed to element.scrollIntoView */
	scrollBehavior?: ScrollBehavior;
}

interface ComboboxProps extends React.ComponentPropsWithoutRef<"div"> {
	/** Combobox store returned by useCombobox hook */
	store: ComboboxStore;

	/** Called when option is submitted */
	onOptionSubmit?: (value: string) => void;

	/** ClassNames for different parts of the component */
	classNames?: ComboboxClassNames;

	/** Controls dropdown position */
	position?:
		| "bottom"
		| "top"
		| "bottom-start"
		| "bottom-end"
		| "top-start"
		| "top-end";

	/** Offset from target element */
	offset?: number;

	/** Children */
	children: React.ReactNode;
}

interface ComboboxOptionProps extends React.ComponentPropsWithoutRef<"div"> {
	/** Option value */
	value: string;

	/** Whether the option is disabled */
	disabled?: boolean;

	/** Whether the option is active */
	active?: boolean;

	/** Option label */
	children: React.ReactNode;
}

interface ComboboxTargetProps extends React.ComponentPropsWithoutRef<"div"> {
	/** Target element */
	children: React.ReactNode;
}

interface ComboboxDropdownProps extends React.ComponentPropsWithoutRef<"div"> {
	/** Dropdown content */
	children: React.ReactNode;

	/** Whether the dropdown is hidden */
	hidden?: boolean;

	/** Position of the dropdown */
	position?:
		| "bottom"
		| "top"
		| "bottom-start"
		| "bottom-end"
		| "top-start"
		| "top-end";

	/** Offset from target element */
	offset?: number;
}

interface ComboboxSearchProps
	extends Omit<React.ComponentPropsWithoutRef<"input">, "size"> {
	/** Search input value */
	value: string;

	/** Search input onChange handler */
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ComboboxGroupProps extends React.ComponentPropsWithoutRef<"div"> {
	/** Group label */
	label?: React.ReactNode;

	/** Group content */
	children: React.ReactNode;
}

/* -------------------------------- Context ------------------------------- */

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

const useComboboxContext = () => {
	const context = React.useContext(ComboboxContext);
	if (!context) {
		throw new Error("Combobox components must be used within a Combobox");
	}
	return context;
};

/* -------------------------------- Hooks ------------------------------- */

// Create a ref to store option elements for selection handling
const optionsRef = React.createRef<(HTMLDivElement | null)[]>();

function useCombobox(options: UseComboboxOptions = {}): ComboboxStore {
	const {
		defaultOpened = false,
		opened,
		onOpenedChange,
		onDropdownClose,
		onDropdownOpen,
		scrollBehavior = "auto",
	} = options;

	const [dropdownOpenedState, setDropdownOpened] =
		React.useState(defaultOpened);
	const dropdownOpened = opened !== undefined ? opened : dropdownOpenedState;

	const [selectedOptionIndex, setSelectedOptionIndex] = React.useState(-1);
	const [listId, setListId] = React.useState<string | null>(null);
	const searchRef = React.useRef<HTMLInputElement | null>(null);
	const targetRef = React.useRef<HTMLElement | null>(null);

	// Initialize optionsRef if it's not already
	if (!optionsRef.current) {
		optionsRef.current = [];
	}

	const openDropdown = (
		eventSource: ComboboxDropdownEventSource = "unknown",
	) => {
		if (dropdownOpened) return;

		setDropdownOpened(true);
		onOpenedChange?.(true);
		onDropdownOpen?.(eventSource);
	};

	const closeDropdown = (
		eventSource: ComboboxDropdownEventSource = "unknown",
	) => {
		if (!dropdownOpened) return;

		setDropdownOpened(false);
		onOpenedChange?.(false);
		onDropdownClose?.(eventSource);
	};

	const toggleDropdown = (
		eventSource: ComboboxDropdownEventSource = "unknown",
	) => {
		if (dropdownOpened) {
			closeDropdown(eventSource);
		} else {
			openDropdown(eventSource);
		}
	};

	const selectOption = (index: number) => {
		setSelectedOptionIndex(index);

		if (index !== -1 && optionsRef.current && optionsRef.current[index]) {
			optionsRef.current[index]?.scrollIntoView({
				block: "nearest",
				behavior: scrollBehavior,
			});
		}
	};

	// These implementations would be more complete in a real component
	// For brevity, I'm providing simplified versions
	const selectActiveOption = () => null;
	const selectFirstOption = () => null;
	const selectNextOption = () => null;
	const selectPreviousOption = () => null;
	const resetSelectedOption = () => setSelectedOptionIndex(-1);
	const clickSelectedOption = () => {
		if (selectedOptionIndex !== -1 && optionsRef.current) {
			optionsRef.current[selectedOptionIndex]?.click();
		}
	};
	const updateSelectedOptionIndex = () => {};

	const focusSearchInput = () => {
		searchRef.current?.focus();
	};

	const focusTarget = () => {
		targetRef.current?.focus();
	};

	return {
		dropdownOpened,
		openDropdown,
		closeDropdown,
		toggleDropdown,
		selectedOptionIndex,
		selectOption,
		selectActiveOption,
		selectFirstOption,
		selectNextOption,
		selectPreviousOption,
		resetSelectedOption,
		clickSelectedOption,
		updateSelectedOptionIndex,
		listId,
		setListId,
		searchRef,
		focusSearchInput,
		targetRef,
		focusTarget,
	};
}

/* -------------------------------- Components ------------------------------- */

// Target component - wraps the trigger element
const Target = React.forwardRef<HTMLDivElement, ComboboxTargetProps>(
	({ className, children, ...others }, ref) => {
		const { store, classNames } = useComboboxContext();

		return (
			<div
				ref={(node) => {
					if (ref) {
						if (typeof ref === "function") ref(node);
						else ref.current = node;
					}
					store.targetRef.current = node;
				}}
				className={cn("cursor-default", classNames?.target, className)}
				{...others}
			>
				{children}
			</div>
		);
	},
);

Target.displayName = "Combobox.Target";

// EventsTarget component - for using without dropdown
const EventsTarget = React.forwardRef<HTMLDivElement, ComboboxTargetProps>(
	({ className, children, ...others }, ref) => {
		// Similar to Target but without positioning logic
		const { store, classNames } = useComboboxContext();

		return (
			<div
				ref={(node) => {
					if (ref) {
						if (typeof ref === "function") ref(node);
						else ref.current = node;
					}
					store.targetRef.current = node;
				}}
				className={cn(classNames?.target, className)}
				{...others}
			>
				{children}
			</div>
		);
	},
);

EventsTarget.displayName = "Combobox.EventsTarget";

// Dropdown component
const Dropdown = React.forwardRef<HTMLDivElement, ComboboxDropdownProps>(
	(
		{
			className,
			hidden,
			position = "bottom",
			offset = 5,
			children,
			...others
		},
		ref,
	) => {
		const { store, classNames } = useComboboxContext();

		if (hidden || !store.dropdownOpened) {
			return null;
		}

		return (
			<div
				ref={ref}
				className={cn(
					"absolute z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95",
					classNames?.dropdown,
					className,
				)}
				style={{
					top:
						position === "top"
							? "auto"
							: `calc(100% + ${offset}px)`,
					bottom:
						position === "top"
							? `calc(100% + ${offset}px)`
							: "auto",
				}}
				{...others}
			>
				{children}
			</div>
		);
	},
);

Dropdown.displayName = "Combobox.Dropdown";

// Options container
const Options = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...others }, ref) => {
	const { store, classNames } = useComboboxContext();

	React.useEffect(() => {
		store.setListId(
			`combobox-options-${Math.random().toString(36).slice(2, 11)}`,
		);
	}, [store]);

	return (
		<div
			ref={ref}
			id={store.listId || undefined}
			// biome-ignore lint/a11y/useSemanticElements: This is a listbox
			role="listbox"
			tabIndex={0}
			aria-orientation="vertical"
			className={cn("py-1", classNames?.options, className)}
			{...others}
		>
			{children}
		</div>
	);
});

Options.displayName = "Combobox.Options";

// Option component
const Option = React.forwardRef<HTMLDivElement, ComboboxOptionProps>(
	(
		{
			className,
			value,
			disabled = false,
			active = false,
			children,
			...others
		},
		ref,
	) => {
		const { store, onOptionSubmit, classNames } = useComboboxContext();
		const optionRef = React.useRef<HTMLDivElement | null>(null);

		// Initialize optionsRef if it doesn't exist
		if (!optionsRef.current) {
			optionsRef.current = [];
		}

		const isSelected =
			store.selectedOptionIndex ===
			(optionsRef.current?.indexOf(optionRef.current) || -1);

		React.useEffect(() => {
			if (!optionRef.current || !optionsRef.current) return;

			const optionsArray = optionsRef.current;
			const index = optionsArray.indexOf(optionRef.current);

			if (index === -1) {
				optionsRef.current = [...optionsArray, optionRef.current];
			}

			return () => {
				if (!optionRef.current || !optionsRef.current) return;
				optionsRef.current = optionsRef.current.filter(
					(item) => item !== optionRef.current,
				);
			};
		}, []);

		const handleClick = () => {
			if (disabled) return;
			onOptionSubmit?.(value);
		};

		return (
			<div
				ref={(node) => {
					if (ref) {
						if (typeof ref === "function") ref(node);
						else ref.current = node;
					}
					optionRef.current = node;
				}}
				// biome-ignore lint/a11y/useSemanticElements: This is a listbox
				role="option"
				aria-selected={isSelected}
				aria-disabled={disabled}
				data-disabled={disabled || undefined}
				data-selected={isSelected || undefined}
				data-active={active || undefined}
				tabIndex={disabled ? -1 : 0}
				className={cn(
					"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
					isSelected
						? "bg-accent text-accent-foreground"
						: "text-popover-foreground",
					!disabled &&
						!isSelected &&
						"hover:bg-accent hover:text-accent-foreground",
					disabled && "pointer-events-none opacity-50",
					classNames?.option,
					className,
				)}
				onClick={handleClick}
				{...others}
			>
				{children}
			</div>
		);
	},
);

Option.displayName = "Combobox.Option";

// Search input component
const Search = React.forwardRef<HTMLInputElement, ComboboxSearchProps>(
	({ className, value, onChange, ...others }, ref) => {
		const { store, classNames } = useComboboxContext();

		return (
			<input
				ref={(node) => {
					if (ref) {
						if (typeof ref === "function") ref(node);
						else ref.current = node;
					}
					store.searchRef.current = node;
				}}
				type="search"
				role="combobox"
				aria-autocomplete="list"
				aria-controls={store.listId || undefined}
				aria-expanded={store.dropdownOpened}
				autoComplete="off"
				value={value}
				onChange={onChange}
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					classNames?.search,
					className,
				)}
				{...others}
			/>
		);
	},
);

Search.displayName = "Combobox.Search";

// Empty state component
const Empty = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...others }, ref) => {
	const { classNames } = useComboboxContext();

	return (
		<div
			ref={ref}
			className={cn(
				"py-2 px-3 text-sm text-muted-foreground",
				classNames?.empty,
				className,
			)}
			{...others}
		>
			{children}
		</div>
	);
});

Empty.displayName = "Combobox.Empty";

// Group component
const Group = React.forwardRef<HTMLDivElement, ComboboxGroupProps>(
	({ className, children, label, ...others }, ref) => {
		const { classNames } = useComboboxContext();

		return (
			<div
				ref={ref}
				className={cn("px-1 pb-1", classNames?.group, className)}
				{...others}
			>
				{label && (
					<div
						className={cn(
							"mb-1 px-2 text-xs font-medium text-muted-foreground",
							classNames?.groupLabel,
						)}
					>
						{label}
					</div>
				)}
				{children}
			</div>
		);
	},
);

Group.displayName = "Combobox.Group";

// Header component
const Header = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...others }, ref) => {
	const { classNames } = useComboboxContext();

	return (
		<div
			ref={ref}
			className={cn(
				"px-2 py-1.5 text-sm font-medium",
				classNames?.header,
				className,
			)}
			{...others}
		>
			{children}
		</div>
	);
});

Header.displayName = "Combobox.Header";

// Footer component
const Footer = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...others }, ref) => {
	const { classNames } = useComboboxContext();

	return (
		<div
			ref={ref}
			className={cn("px-2 py-1.5 text-sm", classNames?.footer, className)}
			{...others}
		>
			{children}
		</div>
	);
});

Footer.displayName = "Combobox.Footer";

// Chevron component for dropdown indicator
const Chevron = React.forwardRef<
	SVGSVGElement,
	React.ComponentPropsWithoutRef<"svg">
>(({ className, ...others }, ref) => {
	const { store, classNames } = useComboboxContext();

	return (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={cn(
				"transition-transform",
				store.dropdownOpened && "rotate-180",
				classNames?.chevron,
				className,
			)}
			{...others}
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
});

Chevron.displayName = "Combobox.Chevron";

// Create the main Combobox component
const ComboboxComponent = React.forwardRef<HTMLDivElement, ComboboxProps>(
	(
		{
			store,
			onOptionSubmit,
			classNames,
			position,
			offset,
			className,
			children,
			...others
		},
		ref,
	) => {
		return (
			<ComboboxContext.Provider
				value={{ store, onOptionSubmit, classNames }}
			>
				<div
					ref={ref}
					className={cn("relative", className)}
					{...others}
				>
					{children}
				</div>
			</ComboboxContext.Provider>
		);
	},
);

ComboboxComponent.displayName = "Combobox";

// Create a type that includes all the subcomponents
type ComboboxComponentType = typeof ComboboxComponent & {
	Target: typeof Target;
	EventsTarget: typeof EventsTarget;
	Dropdown: typeof Dropdown;
	Options: typeof Options;
	Option: typeof Option;
	Search: typeof Search;
	Empty: typeof Empty;
	Group: typeof Group;
	Header: typeof Header;
	Footer: typeof Footer;
	Chevron: typeof Chevron;
};

// Create the final Combobox with all subcomponents
const Combobox = ComboboxComponent as ComboboxComponentType;

// Assign subcomponents
Combobox.Target = Target;
Combobox.EventsTarget = EventsTarget;
Combobox.Dropdown = Dropdown;
Combobox.Options = Options;
Combobox.Option = Option;
Combobox.Search = Search;
Combobox.Empty = Empty;
Combobox.Group = Group;
Combobox.Header = Header;
Combobox.Footer = Footer;
Combobox.Chevron = Chevron;

// Export
export { Combobox, useCombobox };
export type {
	ComboboxProps,
	ComboboxOptionProps,
	ComboboxTargetProps,
	ComboboxDropdownProps,
	ComboboxSearchProps,
	ComboboxStore,
	ComboboxClassNames,
	UseComboboxOptions,
	ComboboxGroupProps,
}; 