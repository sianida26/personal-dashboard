import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { FilterState, FilterType } from "./filterEngine";

export type AdaptiveColumnDef<T> = ColumnDef<T> & {
	/** Enable inline editing for this column */
	editable?: boolean;
	/** Callback when cell value is edited */
	onEdited?: (rowIndex: number, columnId: string, value: unknown) => void;
	/**
	 * Type of editor to use for inline editing
	 * @default "text"
	 */
	editType?: "text" | "select";
	/** Options for select editor type */
	options?: Array<{
		label: string;
		value: string | number;
		color?: string;
	}>;
	/** Custom component to render select options */
	customOptionComponent?: (option: {
		label: string;
		value: string | number;
		color?: string;
	}) => ReactNode;
	/** Custom CSS class for the cell */
	cellClassName?: string;
	/** Function to determine cell background color based on value */
	getCellColor?: (value: unknown) => string | undefined;
	/**
	 * Override columnOrderable for this specific column
	 * @default undefined (inherits from table setting)
	 */
	orderable?: boolean;
	/**
	 * Override columnResizable for this specific column
	 * @default undefined (inherits from table setting)
	 */
	resizable?: boolean;
	/**
	 * Override columnVisibilityToggle for this specific column
	 * @default undefined (inherits from table setting)
	 */
	visibilityToggle?: boolean;
	/**
	 * Override sortable for this specific column
	 * @default undefined (inherits from table setting)
	 */
	sortable?: boolean;
	/**
	 * Whether this column can be filtered
	 * @default true (for accessor columns)
	 */
	filterable?: boolean;
	/**
	 * Type of filter to use (auto-detected if not specified)
	 * Auto-detection: "select" if has options, "number" for numeric columns, otherwise "text"
	 */
	filterType?: FilterType;
};

// Represents a column that can be filtered
export interface FilterableColumn {
	columnId: string;
	filterType: FilterType;
	options?: Array<{
		label: string;
		value: string | number;
	}>;
}

export interface TableSettingsLabels {
	columnVisibility?: string;
	propertyVisibility?: string;
	shownInTable?: string;
	hidden?: string;
	groupBy?: string;
	groupByProperty?: string;
	sort?: string;
	moreOptions?: string;
	filter?: string;
	resetSettings?: string;
}

export type AdaptiveTableProps<T> = {
	/** Column definitions for the table */
	columns: AdaptiveColumnDef<T>[];
	/** Data to display in the table */
	data: T[];
	/** Enable column reordering via drag and drop */
	columnOrderable?: boolean;
	/** Enable column resizing */
	columnResizable?: boolean;
	/**
	 * Enable column visibility toggle in settings menu
	 * @default true
	 */
	columnVisibilityToggle?: boolean;
	/**
	 * Enable grouping functionality
	 * @default true
	 */
	groupable?: boolean;
	/** Unique key to save/load table state to localStorage */
	saveState?: string;
	/**
	 * Enable column sorting
	 * @default true
	 */
	sortable?: boolean;
	/** Callback when sorting state changes */
	onSortingChange?: (sorting: SortingState) => void;
	/**
	 * Enable filtering functionality
	 * @default true
	 */
	filterable?: boolean;
	/** Callback when filters change */
	onFiltersChange?: (filters: FilterState) => void;
	/**
	 * Enable search input in header
	 * @default true
	 */
	search?: boolean;
	/** Callback when search value changes */
	onSearchChange?: (searchValue: string) => void;
	/**
	 * TTL for persisted search query in seconds
	 * @default 1800 (30 minutes)
	 */
	searchQueryPersistedTtl?: number;
	/** Title displayed in the table header */
	title?: string;
	/** Custom action buttons displayed in the header */
	headerActions?: ReactNode;
	/**
	 * Show the table header section
	 * @default true
	 */
	showHeader?: boolean;
	/**
	 * Enable detail view/sheet for rows
	 * @default true
	 */
	showDetail?: boolean;
	/** Callback when a row detail is clicked */
	onDetailClick?: (row: T, rowIndex: number) => void;
	/**
	 * Enable pagination
	 * @default false
	 */
	pagination?: boolean;
	/**
	 * Type of pagination to use
	 * @default "client"
	 */
	paginationType?: "client" | "server";
	/** Callback when pagination changes (perPage or page) */
	onPaginationChange?: (perPage: number, currentPage: number) => void;
	/** Current page number (for server-side pagination) */
	currentPage?: number;
	/** Total number of records (for server-side pagination) */
	recordsTotal?: number;
	/** Maximum number of pages (required if pagination is true) */
	maxPage?: number;
	/**
	 * Show skeleton loader while data is loading
	 * @default false
	 */
	isLoading?: boolean;
	/**
	 * @deprecated Use isLoading instead
	 */
	loading?: boolean;
	/**
	 * Show "Updating..." indicator while revalidating (stale-while-revalidate pattern)
	 * @default false
	 */
	isRevalidating?: boolean;
	/**
	 * Custom text for revalidating indicator
	 * @default "Updating data..."
	 */
	revalidatingText?: string;
	/**
	 * Enable row selection with checkboxes
	 * @default false
	 */
	rowSelectable?: boolean;
	/** Actions to show when rows are selected */
	selectActions?: Array<{ name: string; button: ReactNode }>;
	/** Callback when a row is selected */
	onSelect?: (row: T) => void;
	/** Callback when a select action is triggered */
	onSelectAction?: (rows: T[], actionName: string) => void;
	/**
	 * Enable row virtualization for better performance with large datasets
	 * @default true
	 */
	rowVirtualization?: boolean;
	/**
	 * Fixed row height in pixels (required for virtualization)
	 * @default 40
	 */
	rowHeight?: number;
	/**
	 * Height of the table container
	 * @default "100%"
	 */
	tableHeight?: string;
	/**
	 * Scale columns to fit parent width without horizontal scroll
	 * @default false
	 */
	fitToParentWidth?: boolean;
	/**
	 * Scale rows to fit parent height without vertical scroll
	 * @default false
	 */
	fitToParentHeight?: boolean;
	/** Custom labels for table settings menu */
	labels?: Partial<TableSettingsLabels>;
	/**
	 * Control the "New" button display
	 * - false: Hide the button
	 * - true: Show default "New" button
	 * - ReactNode: Custom button content
	 * @default true
	 */
	newButton?: ReactNode | boolean;
	/**
	 * Callback when the "New" button is clicked.
	 * If not provided, default behavior is to show a drawer for creating new item.
	 */
	onNewButtonClick?: () => void;
	/**
	 * Callback when creating a new item from the default drawer.
	 * Only used when onNewButtonClick is not provided.
	 * Should return a promise that resolves on success or throws on error.
	 * @param data - The form data from the drawer
	 */
	onCreateItem?: (data: Record<string, unknown>) => Promise<void>;
	/**
	 * Field definitions for the "New" item drawer form.
	 * If not provided, fields are auto-generated from column definitions.
	 * Columns with `editable: true` or `editType` will be included.
	 */
	newItemFields?: NewItemField[];
	/**
	 * Title for the "New" item drawer
	 * @default "Create New Item"
	 */
	newItemDrawerTitle?: string;
};

export interface NewItemField {
	/** Field name/key */
	name: string;
	/** Field label */
	label: string;
	/** Field type */
	type: "text" | "number" | "select" | "checkbox" | "textarea" | "password";
	/** Whether the field is required */
	required?: boolean;
	/** Placeholder text */
	placeholder?: string;
	/** Default value */
	defaultValue?: unknown;
	/** Options for select type */
	options?: Array<{ label: string; value: string | number }>;
}

export interface TableState {
	columnOrder?: string[];
	columnSizing?: Record<string, number>;
	columnVisibility?: Record<string, boolean>;
	groupBy?: string | null;
	expandedGroups?: Record<string, boolean>;
	perPage?: number;
	sorting?: SortingState;
	filters?: FilterState;
	searchQuery?: string;
	searchQueryTimestamp?: number;
}
