import { useMemo, useState } from "react";

export interface UseTablePaginationProps<T> {
	/**
	 * Whether pagination is enabled
	 */
	enabled: boolean;

	/**
	 * Type of pagination: "client" or "server"
	 */
	type: "client" | "server";

	/**
	 * Current page from parent (controlled)
	 */
	currentPage?: number;

	/**
	 * Maximum page for server-side pagination
	 */
	maxPage?: number;

	/**
	 * Items per page
	 */
	perPage: number;

	/**
	 * All data items (for client-side pagination)
	 */
	data: T[];

	/**
	 * Whether the table is currently loading
	 */
	loading?: boolean;

	/**
	 * Whether data is grouped (affects pagination visibility)
	 */
	isGrouped?: boolean;

	/**
	 * Callback for pagination changes (server-side)
	 */
	onPaginationChange?: (perPage: number, currentPage: number) => void;

	/**
	 * Callback to update perPage in persistent state
	 */
	onPerPageChange?: (perPage: number) => void;
}

export interface UseTablePaginationReturn<T> {
	/**
	 * Current page number
	 */
	currentPage: number;

	/**
	 * Maximum page number
	 */
	maxPage: number;

	/**
	 * Data for the current page
	 */
	paginatedData: T[];

	/**
	 * Whether pagination controls should be visible
	 */
	shouldShowPagination: boolean;

	/**
	 * Handler for per-page change
	 */
	handlePaginationChange: (
		newPerPage: number,
		newCurrentPage: number,
	) => void;

	/**
	 * Handler for page navigation
	 */
	handlePageChange: (newPage: number) => void;
}

/**
 * Custom hook for table pagination logic
 *
 * Handles both client-side and server-side pagination with support for:
 * - Page navigation
 * - Per-page size changes
 * - Automatic data slicing for client-side
 * - Conditional visibility based on grouping/loading state
 */
export function useTablePagination<T>({
	enabled,
	type,
	currentPage: controlledCurrentPage,
	maxPage: serverMaxPage,
	perPage,
	data,
	loading = false,
	isGrouped = false,
	onPaginationChange,
	onPerPageChange,
}: UseTablePaginationProps<T>): UseTablePaginationReturn<T> {
	// Internal state for uncontrolled pagination
	const [internalCurrentPage, setInternalCurrentPage] = useState(1);

	// Use controlled or internal current page
	const currentPage = controlledCurrentPage ?? internalCurrentPage;

	// Handle client-side pagination
	const paginatedData = useMemo(() => {
		if (!enabled || type === "server") {
			return data;
		}

		const startIndex = (currentPage - 1) * perPage;
		const endIndex = startIndex + perPage;
		return data.slice(startIndex, endIndex);
	}, [data, enabled, type, currentPage, perPage]);

	// Calculate max page
	const maxPage = useMemo(() => {
		if (!enabled) return 1;
		if (type === "server") {
			return serverMaxPage ?? 1;
		}
		return Math.ceil(data.length / perPage);
	}, [enabled, type, serverMaxPage, data.length, perPage]);

	// Handle pagination change (per-page size)
	const handlePaginationChange = (
		newPerPage: number,
		newCurrentPage: number,
	) => {
		// Update perPage in persistent state
		if (onPerPageChange) {
			onPerPageChange(newPerPage);
		}

		if (type === "server" && onPaginationChange) {
			onPaginationChange(newPerPage, newCurrentPage);
		} else {
			setInternalCurrentPage(newCurrentPage);
		}
	};

	// Handle page navigation
	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > maxPage) return;

		if (type === "server" && onPaginationChange) {
			onPaginationChange(perPage, newPage);
		} else {
			setInternalCurrentPage(newPage);
		}
	};

	// Determine if pagination should be visible
	// Hide pagination when: grouped (client-side only) or loading
	const shouldShowPagination = useMemo(() => {
		if (!enabled) return false;
		if (loading) return false;
		// For client-side pagination, hide when grouped
		if (type === "client" && isGrouped) return false;
		return true;
	}, [enabled, loading, type, isGrouped]);

	return {
		currentPage,
		maxPage,
		paginatedData,
		shouldShowPagination,
		handlePaginationChange,
		handlePageChange,
	};
}
