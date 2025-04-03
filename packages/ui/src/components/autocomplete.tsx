import * as React from "react";
import { Combobox, useCombobox } from "./combobox";
import { Input } from "./input";
import { cn } from "../utils";

export interface AutocompleteOption {
	/** The value that will be set when the option is selected */
	value: string;

	/** The text or JSX element displayed in the dropdown */
	label: React.ReactNode;

	/** Whether the option is disabled and cannot be selected */
	disabled?: boolean;

	/** Optional CSS class name for the option */
	className?: string;

	/** Additional data attributes or custom properties */
	[key: string]: unknown;
}

export interface AutocompleteProps {
	/** Array of options for the dropdown */
	options: AutocompleteOption[];

	/** Current selected value */
	value: string | null;

	/** Function called when selection changes */
	onChange: (value: string | null) => void;

	/** Placeholder text for the input when no value is selected */
	placeholder?: string;

	/** Controlled search input value */
	searchValue?: string;

	/** Function called when search input changes */
	onSearchChange?: (value: string) => void;

	/** Whether the component is disabled */
	disabled?: boolean;

	/** Whether the component is read-only */
	readOnly?: boolean;

	/** Function called when the input is focused */
	onFocus?: React.FocusEventHandler<HTMLInputElement>;

	/** Function called when the input loses focus */
	onBlur?: React.FocusEventHandler<HTMLInputElement>;

	/** Error message or state */
	error?: string | boolean;

	/** Custom filter function for options */
	filter?: (option: AutocompleteOption, query: string) => boolean;

	/** Text to display when no options match the filter */
	emptyMessage?: React.ReactNode;

	/** Additional classes to apply to the component parts */
	classNames?: {
		root?: string;
		input?: string;
		dropdown?: string;
		option?: string;
		empty?: string;
	};
}

export function Autocomplete({
	options,
	value,
	onChange,
	placeholder = "Search...",
	searchValue: controlledSearchValue,
	onSearchChange,
	disabled = false,
	readOnly = false,
	onFocus,
	onBlur,
	error,
	filter,
	emptyMessage = "No options found",
	classNames,
}: AutocompleteProps) {
	const combobox = useCombobox();

	// Get selected option
	const selectedOption = React.useMemo(
		() => options.find((option) => option.value === value),
		[options, value],
	);

	// Handle controlled/uncontrolled search input
	const [uncontrolledSearchValue, setUncontrolledSearchValue] =
		React.useState("");
	const isControlled = controlledSearchValue !== undefined;
	const searchValue = isControlled
		? controlledSearchValue
		: uncontrolledSearchValue;

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.currentTarget.value;

		if (!isControlled) {
			setUncontrolledSearchValue(newValue);
		}

		onSearchChange?.(newValue);

		// Don't open dropdown if readonly
		if (!readOnly) {
			combobox.openDropdown();
		}
	};

	// Filter options based on search query
	const filteredOptions = React.useMemo(() => {
		if (!searchValue) return options;

		const filterFn =
			filter ||
			((option, query) => {
				const label = String(option.label).toLowerCase();
				return label.includes(query.toLowerCase().trim());
			});

		return options.filter((option) => filterFn(option, searchValue));
	}, [options, searchValue, filter]);

	// Handle option selection
	const handleOptionSubmit = (optionValue: string) => {
		if (readOnly) return;

		const option = options.find((o) => o.value === optionValue);

		if (option) {
			onChange(option.value);

			if (!isControlled) {
				setUncontrolledSearchValue(String(option.label));
			}

			combobox.closeDropdown();
		}
	};

	// Reset the search value when the dropdown is closed
	React.useEffect(() => {
		if (!combobox.dropdownOpened && !isControlled) {
			setUncontrolledSearchValue(
				selectedOption ? String(selectedOption.label) : "",
			);
		}
	}, [combobox.dropdownOpened, selectedOption, isControlled]);

	// Custom focus handler
	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		onFocus?.(e);
		if (!readOnly) {
			combobox.openDropdown();
		}
	};

	// Custom blur handler
	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		onBlur?.(e);
		// Don't close immediately as it may prevent option selection
		setTimeout(() => {
			if (!combobox.dropdownOpened) {
				// Reset to selected value if nothing was selected
				if (!isControlled && selectedOption) {
					setUncontrolledSearchValue(String(selectedOption.label));
				}
			}
		}, 100);
	};

	return (
		<Combobox
			store={combobox}
			onOptionSubmit={handleOptionSubmit}
			classNames={{
				dropdown: classNames?.dropdown,
				option: classNames?.option,
				empty: classNames?.empty,
			}}
			className={cn(classNames?.root)}
		>
			<Combobox.Target>
				<Input
					value={searchValue}
					onChange={handleSearchChange}
					placeholder={placeholder}
					onClick={() => !readOnly && combobox.openDropdown()}
					onFocus={handleFocus}
					onBlur={handleBlur}
					disabled={disabled}
					readOnly={readOnly}
					className={cn(
						error &&
							"border-destructive focus-visible:ring-destructive",
						classNames?.input,
					)}
					aria-invalid={!!error}
				/>
			</Combobox.Target>

			{!readOnly && (
				<Combobox.Dropdown>
					<Combobox.Options>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option) => (
								<Combobox.Option
									key={option.value}
									value={option.value}
									disabled={option.disabled}
									className={option.className}
								>
									{option.label}
								</Combobox.Option>
							))
						) : (
							<Combobox.Empty>{emptyMessage}</Combobox.Empty>
						)}
					</Combobox.Options>
				</Combobox.Dropdown>
			)}
		</Combobox>
	);
} 