import type {
	ColumnDef,
	ColumnHelper,
	createColumnHelper,
} from "@tanstack/react-table";

import PageTemplate from "@/components/PageTemplate";

import type { Props } from "@/components/PageTemplate";

/**
 * Utility to create a typed PageTemplate component with custom column definitions.
 * Ensures type inference for table data and columns in PageTemplate usage.
 *
 * @template TData - The row data type for the table, must extend Record<string, unknown>.
 * @param props - All PageTemplate props except columnDefs, plus a columnDefs factory function.
 * @returns A PageTemplate component instance with the provided props and columns.
 */
export function createPageTemplate<TData extends Record<string, unknown>>(
	props: Omit<Props<TData>, "columnDefs"> & {
		columnDefs: (
			helper: ColumnHelper<TData>,
		) => Array<ReturnType<typeof createColumnHelper<TData>> | unknown>;
	},
) {
	// This wrapper ensures type inference works without explicit generic parameters
	return (
		<PageTemplate<TData>
			{...props}
			columnDefs={(helper) =>
				props.columnDefs(helper) as ColumnDef<TData, unknown>[]
			}
		/>
	);
}
