import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import type { ClientRequestOptions } from "hono";
import type { ClientResponse } from "hono/client";
import { useCallback, useMemo, useState } from "react";
import AdaptiveTable from "./AdaptiveTable";
import type { FilterState } from "./filterEngine";
import type { AdaptiveColumnDef, AdaptiveTableProps } from "./types";
import { loadTableState } from "./utils";

/**
 * Standard paginated response format from the backend
 */
export interface PaginatedResponse<T> {
	data: T[];
	_metadata: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		perPage: number;
	};
}

/**
 * Query parameters sent to the backend
 */
export interface ServerQueryParams {
	page: string;
	limit: string;
	q?: string;
	sort?: string;
	filter?: string;
}

/**
 * Hono endpoint type for paginated data
 */
type HonoEndpoint<T> = (
	args: { query: ServerQueryParams },
	options?: ClientRequestOptions,
) => Promise<ClientResponse<PaginatedResponse<T>>>;

/**
 * Props for ServerDataTable component
 * Extends most AdaptiveTableProps but handles data fetching internally
 */
export interface ServerDataTableProps<T>
	extends Omit<
		AdaptiveTableProps<T>,
		// Remove props that ServerDataTable manages internally
		| "data"
		| "isLoading"
		| "isRevalidating"
		| "error"
		| "paginationType"
		| "currentPage"
		| "maxPage"
		| "recordsTotal"
		| "onPaginationChange"
		| "onSortingChange"
		| "onFiltersChange"
		| "onSearchChange"
	> {
	/** Hono RPC endpoint that returns paginated data */
	endpoint: HonoEndpoint<T>;
	/** Unique key for React Query caching */
	queryKey: unknown[];
	/** Function to transform the API response before using */
	transformResponse?: (
		response: PaginatedResponse<T>,
	) => PaginatedResponse<T>;
	/** Callback when data is successfully fetched */
	onDataFetched?: (
		data: T[],
		metadata: PaginatedResponse<T>["_metadata"],
	) => void;
	/** Additional query parameters to send with every request */
	additionalParams?: Record<string, string>;
	/** Custom fetch function (defaults to built-in fetcher) */
	// biome-ignore lint/suspicious/noExplicitAny: Allow any fetch function signature
	fetchFn?: (promise: Promise<ClientResponse<any>>) => Promise<any>;
}

// Default fetchRPC implementation
async function defaultFetchRPC<T>(
	promise: Promise<ClientResponse<T>>,
): Promise<T> {
	const response = await promise;
	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(
			(error as { message?: string }).message || "Request failed",
		);
	}
	return response.json() as Promise<T>;
}

/**
 * ServerDataTable - A wrapper around AdaptiveTable that handles server-side
 * data fetching with built-in pagination, sorting, filtering, and search.
 *
 * This component encapsulates the common pattern of:
 * - Managing pagination, sorting, filter, and search state
 * - Building query parameters
 * - Using React Query for data fetching
 * - Passing all the relevant props to AdaptiveTable
 *
 * Type parameter `T` is automatically inferred from the `columns` prop.
 *
 * @example
 * ```tsx
 * // Type is automatically inferred from columns
 * <ServerDataTable
 *   endpoint={client.users.$get}
 *   queryKey={["users"]}
 *   columns={columns}
 *   saveState="users-table"
 *   title="Users"
 * />
 * ```
 */
export function ServerDataTable<T>({
	endpoint,
	queryKey,
	columns,
	saveState,
	transformResponse,
	onDataFetched,
	additionalParams,
	fetchFn = defaultFetchRPC,
	pagination = true,
	pageSizeOptions = [10, 25, 50, 100],
	sortable = true,
	filterable = true,
	search = true,
	...tableProps
}: ServerDataTableProps<T>) {
	// Initialize state from localStorage if saveState is provided
	const initialState = saveState ? loadTableState(saveState) : null;

	// Pagination state
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(() => initialState?.perPage ?? 10);

	// Sorting state
	const [sorting, setSorting] = useState<SortingState>(
		() => initialState?.sorting ?? [],
	);

	// Filter state
	const [filters, setFilters] = useState<FilterState>(
		() => initialState?.filters ?? [],
	);

	// Search state
	const [searchQuery, setSearchQuery] = useState(
		() => initialState?.searchQuery ?? "",
	);

	// Build query parameters for API
	const queryParams = useMemo(() => {
		const params: ServerQueryParams = {
			page: page.toString(),
			limit: perPage.toString(),
		};

		// Add search query
		if (searchQuery) {
			params.q = searchQuery;
		}

		// Add sorting parameters (format: "column:asc" or "column:desc")
		if (sorting.length > 0) {
			params.sort = sorting
				.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`)
				.join(",");
		}

		// Add filter parameters (format: "column:value")
		if (filters.length > 0) {
			params.filter = filters
				.map((f) => `${f.columnId}:${f.value}`)
				.join(",");
		}

		// Add any additional params
		if (additionalParams) {
			Object.assign(params, additionalParams);
		}

		return params;
	}, [page, perPage, sorting, filters, searchQuery, additionalParams]);

	// Fetch data from server
	const { data, isLoading, isFetching, error } = useQuery({
		queryKey: [...queryKey, queryParams],
		queryFn: async () => {
			const response = await fetchFn(endpoint({ query: queryParams }));
			const transformed = transformResponse
				? transformResponse(response)
				: response;

			// Call onDataFetched callback if provided
			if (onDataFetched) {
				onDataFetched(transformed.data, transformed._metadata);
			}

			return transformed;
		},
		placeholderData: (previousData) => previousData,
	});

	// Handlers
	const handlePaginationChange = useCallback(
		(newPerPage: number, newPage: number) => {
			setPerPage(newPerPage);
			setPage(newPage);
		},
		[],
	);

	const handleSortingChange = useCallback((newSorting: SortingState) => {
		setSorting(newSorting);
		setPage(1); // Reset to first page when sorting changes
	}, []);

	const handleFiltersChange = useCallback((newFilters: FilterState) => {
		setFilters(newFilters);
		setPage(1); // Reset to first page when filters change
	}, []);

	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
		setPage(1); // Reset to first page when search changes
	}, []);

	// Extract data and metadata from response
	const tableData = data?.data ?? [];
	const metadata = data?._metadata;
	const totalPages = metadata?.totalPages ?? 1;
	const totalItems = metadata?.totalItems ?? 0;

	return (
		<AdaptiveTable
			columns={columns as AdaptiveColumnDef<T>[]}
			data={tableData}
			saveState={saveState}
			// Server-side pagination
			pagination={pagination}
			paginationType="server"
			pageSizeOptions={pageSizeOptions}
			currentPage={page}
			maxPage={totalPages}
			recordsTotal={totalItems}
			onPaginationChange={handlePaginationChange}
			// Server-side sorting
			sortable={sortable}
			onSortingChange={handleSortingChange}
			// Server-side filtering
			filterable={filterable}
			onFiltersChange={handleFiltersChange}
			// Server-side search
			search={search}
			onSearchChange={handleSearchChange}
			// Loading states
			isLoading={isLoading}
			isRevalidating={isFetching && !isLoading}
			error={error as Error | null}
			// Pass through remaining props
			{...tableProps}
		/>
	);
}

export default ServerDataTable;
