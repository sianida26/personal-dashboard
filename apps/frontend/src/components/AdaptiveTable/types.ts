import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ReactNode } from "react";

export type AdaptiveColumnDef<T> = ColumnDef<T> & {
	editable?: boolean;
	onEdited?: (rowIndex: number, columnId: string, value: unknown) => void;
	editType?: "text" | "select";
	options?: Array<{
		label: string;
		value: string | number;
		color?: string;
	}>;
	customOptionComponent?: (option: {
		label: string;
		value: string | number;
		color?: string;
	}) => ReactNode;
	cellClassName?: string;
	getCellColor?: (value: unknown) => string | undefined;
	// Column-level overrides for table settings
	orderable?: boolean; // Override columnOrderable for this column
	resizable?: boolean; // Override columnResizable for this column
	visibilityToggle?: boolean; // Override columnVisibilityToggle for this column
	sortable?: boolean; // Override sortable for this column
	settingsLabel?: string; // Custom label for table settings menu (defaults to header)
};

export interface TableSettingsLabels {
	columnVisibility?: string;
	propertyVisibility?: string;
	shownInTable?: string;
	hidden?: string;
	groupBy?: string;
	groupByProperty?: string;
	sort?: string;
	moreOptions?: string;
}

export type AdaptiveTableProps<T> = {
	columns: AdaptiveColumnDef<T>[];
	data: T[];
	columnOrderable?: boolean;
	columnResizable?: boolean;
	columnVisibilityToggle?: boolean; // Default: true
	groupable?: boolean; // Default: true
	saveState?: string; // Unique key to save/load table state
	sortable?: boolean; // Default: true
	onSortingChange?: (sorting: SortingState) => void;
	// Header section props
	title?: string;
	headerActions?: ReactNode;
	showHeader?: boolean; // Default: true
	// Detail view props
	showDetail?: boolean; // Default: true
	onDetailClick?: (row: T, rowIndex: number) => void;
	// Pagination props
	pagination?: boolean; // Default: false
	paginationType?: "client" | "server"; // Default: "client"
	onPaginationChange?: (perPage: number, currentPage: number) => void;
	currentPage?: number;
	recordsTotal?: number; // Total records count (shows "X of Y records")
	maxPage?: number; // Mandatory if pagination is true
	loading?: boolean; // Default: false, shows skeleton loader
	// Row selection props
	rowSelectable?: boolean; // Default: false
	selectActions?: Array<{ name: string; button: ReactNode }>;
	onSelect?: (row: T) => void;
	onSelectAction?: (rows: T[], actionName: string) => void;
	// Row virtualization props
	rowVirtualization?: boolean; // Default: true, enables row virtualization for better performance
	tableHeight?: string; // Default: "100%", height of the table container
	// Layout props
	fitToParentWidth?: boolean; // Default: false, when true columns will shrink to fit parent width without horizontal scroll
	// Custom labels for table settings
	labels?: Partial<TableSettingsLabels>;
};

export interface TableState {
	columnOrder?: string[];
	columnSizing?: Record<string, number>;
	columnVisibility?: Record<string, boolean>;
	groupBy?: string | null;
	expandedGroups?: Record<string, boolean>;
	perPage?: number;
	sorting?: SortingState;
}
