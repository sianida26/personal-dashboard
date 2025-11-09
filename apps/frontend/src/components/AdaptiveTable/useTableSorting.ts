import type { SortingState } from "@tanstack/react-table";
import { useEffect } from "react";

export interface UseTableSortingProps {
	/**
	 * Current sorting state from useTableState
	 */
	sorting: SortingState;

	/**
	 * Callback when sorting changes
	 */
	onSortingChange?: (sorting: SortingState) => void;
}

export interface UseTableSortingReturn {
	/**
	 * Current sorting state (pass-through)
	 */
	sorting: SortingState;
}

/**
 * Custom hook for table sorting logic
 *
 * Handles:
 * - Triggering callback when sorting changes
 * - Pass-through of sorting state for table configuration
 *
 * Note: Most sorting logic is handled by TanStack Table's getSortedRowModel.
 * This hook primarily manages the callback side effect.
 */
export function useTableSorting({
	sorting,
	onSortingChange,
}: UseTableSortingProps): UseTableSortingReturn {
	// Handle sorting callback
	useEffect(() => {
		if (onSortingChange) {
			onSortingChange(sorting);
		}
	}, [sorting, onSortingChange]);

	return {
		sorting,
	};
}
