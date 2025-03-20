import ResponseError from "@/errors/ResponseError";
import fetchRPC from "@/utils/fetchRPC";
import { useDebouncedCallback } from "@mantine/hooks";
import type { PaginatedResponse } from "@repo/data/types";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, Outlet } from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnHelper,
	type SortingState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
	type HeaderContext,
	flexRender,
} from "@tanstack/react-table";
import type { ClientRequestOptions } from "hono";
import type { ClientResponse } from "hono/client";
import React, {
	type ReactNode,
	useState,
	memo,
	useCallback,
	useMemo,
	useEffect,
	type LazyExoticComponent,
} from "react";
import {
	TbPlus,
	TbSearch,
	TbFilter,
	TbArrowUp,
	TbArrowDown,
	TbArrowsSort,
} from "react-icons/tb";
import DashboardTable from "./DashboardTable";
import {
	Button,
	Input,
	Pagination,
	Popover,
	PopoverContent,
	PopoverTrigger,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	NativeSelect,
} from "@repo/ui";

// Define filter types
export type FilterType = "select";

// Define column filter
interface ColumnFilter {
	id: string;
	value: string;
}

// Define filter configuration
export type FilterConfig<T> = {
	id: Extract<keyof T, string>;
	label: string;
	type: FilterType;
	options: { label: string; value: string }[];
};

// Define sorting parameter
export type SortingParam = {
	id: string;
	desc: boolean;
};

// Define filter parameter
export type FilterParam = {
	id: string;
	value: string;
};

// Type to represent the queries that can be sent to the backend
export interface QueryParams {
	page: string;
	limit: string;
	q?: string;
	// Typed sorting parameters as stringified JSON
	sort?: string;
	// Typed filtering parameters as stringified JSON
	filter?: string;
}

type HonoEndpoint<T extends Record<string, unknown>> = (
	args: Record<string, unknown> & {
		query: QueryParams;
	},
	options?: ClientRequestOptions,
) => Promise<ClientResponse<PaginatedResponse<T>>>;

export interface Props<T extends Record<string, unknown>> {
		// Title of the page
		title: string;
		// Endpoint to fetch data from
		endpoint: HonoEndpoint<T>;
		// Column definitions
		columnDefs: (helper: ColumnHelper<T>) => ColumnDef<T, unknown>[];
		// Query key for React Query
		queryKey?: unknown[];
		// Whether to show search bar
		searchBar?: boolean;
		// Which columns can be sorted
		sortableColumns?: Extract<keyof T, string>[];
		// Define which columns can be filtered and how
		filterableColumns?: FilterConfig<T>[];
		// Whether to show column borders
		columnBorders?: boolean;
		// Define which columns cannot be resized (all columns are resizable by default)
		nonResizableColumns?: Extract<keyof T, string>[];
		// Modals to render
		modals?: (ReactNode | LazyExoticComponent<React.ComponentType>)[];
		// Create button configuration
		createButton?: boolean | string | ReactNode;
		// Additional content to be rendered on the left side of create button
		topContent?: ReactNode;
	}

type ColumnFiltersState = Array<{
	id: string;
	value: unknown;
}>;

/**
 * Creates a "Create New" button or returns the provided React node.
 *
 * @param property - The property that determines the type of button to create. It can be a boolean, string, or React node.
 * @returns The create button element.
 */
const createCreateButton = (
	// biome-ignore lint/suspicious/noExplicitAny: any is used to allow for any type of property
	property: Props<any>["createButton"] = true,
) => {
	if (property === true) {
		return (
			//@ts-expect-error global search param for create route
			<Link to={"./create"}>
				<Button leftSection={<TbPlus />}>Create New</Button>
			</Link>
		);
	}
	if (typeof property === "string") {
		return (
			//@ts-expect-error global search param for create route
			<Link to={"./create"}>
				<Button leftSection={<TbPlus />}>{property}</Button>
			</Link>
		);
	}
	return property;
};

const getColumnHelper = <T extends Record<string, unknown>>() =>
	createColumnHelper<T>();

type SearchInputProps = {
	onSearch: (value: string) => void;
};

const SearchInput = memo(function SearchInput({
	onSearch,
	initialValue = "",
}: SearchInputProps & { initialValue?: string }) {
	const [searchInput, setSearchInput] = useState(initialValue);

	const debouncedSetQ = useDebouncedCallback((value: string) => {
		onSearch(value);
	}, 500);

	const handleSearchInputChange = (value: string) => {
		setSearchInput(value);
		debouncedSetQ(value);
	};

	// Update local state when initialValue changes (sync with parent)
	useEffect(() => {
		if (initialValue !== searchInput && initialValue !== "") {
			setSearchInput(initialValue);
		}
	}, [initialValue]);

	return (
		<div className="flex">
			<Input
				leftSection={<TbSearch />}
				value={searchInput}
				onChange={(e) => handleSearchInputChange(e.target.value)}
				placeholder="Search..."
			/>
		</div>
	);
});

// Helper function to ensure type safety for column definitions
export function createTypedColumnDefs<T extends Record<string, unknown>>(
	columnDefsCreator: (
		helper: ColumnHelper<T>,
	) => Array<ColumnDef<T, unknown> | unknown>,
): (helper: ColumnHelper<T>) => ColumnDef<T, unknown>[] {
	return (helper) => {
		const cols = columnDefsCreator(helper);
		return cols as ColumnDef<T, unknown>[];
	};
}

export default function PageTemplate<T extends Record<string, unknown>>(
	props: Props<T>,
) {
	const withSearchBar = Boolean(props.searchBar ?? true);

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [q, setQ] = useState("");
	const [activeFilters, setActiveFilters] = useState<string[]>([]);
	const [showFilterMenu, setShowFilterMenu] = useState(false);

	const columnHelper = React.useMemo(() => getColumnHelper<T>(), []);

	// Memoize sorting parameters
	const sortingParam = React.useMemo((): SortingParam[] | undefined => {
		if (sorting.length === 0) return undefined;

		return sorting.map((sort) => ({
			id: sort.id,
			desc: sort.desc,
		}));
	}, [sorting]);

	const filterParam = React.useMemo((): FilterParam[] | undefined => {
		if (columnFilters.length === 0) return undefined;

		return columnFilters.map((filter) => ({
			id: filter.id,
			value: filter.value as string,
		}));
	}, [columnFilters]);

	// Process column definitions to handle sortable columns
	const processedColumnDefs = React.useMemo(() => {
		const rawColumnDefs = props.columnDefs(columnHelper);

		// If sortableColumns is not provided, all columns are sortable by default
		if (!props.sortableColumns && !props.nonResizableColumns)
			return rawColumnDefs;

		// biome-ignore lint/suspicious/noExplicitAny: necessary for column manipulation
		return rawColumnDefs.map((column: any) => {
			const columnConfig = { ...column };

			// Apply column resizing (all columns are resizable by default unless specified in nonResizableColumns)
			if (
				"accessorKey" in column &&
				props.nonResizableColumns &&
				!props.nonResizableColumns.includes(
					column.accessorKey as Extract<keyof T, string>,
				)
			) {
				columnConfig.enableResizing = true;
			} else if ("accessorKey" in column && !props.nonResizableColumns) {
				// If nonResizableColumns is not provided, make all columns resizable
				columnConfig.enableResizing = true;
			}

			// Apply sorting if needed - we'll handle all accessorKey columns that are either:
			// 1. In the sortableColumns list, or
			// 2. All columns if sortableColumns is not provided
			if (
				"accessorKey" in column &&
				(!props.sortableColumns ||
					props.sortableColumns?.includes(
						column.accessorKey as Extract<keyof T, string>,
					))
			) {
				// Store the original header to use it in our custom header
				const originalHeader = column.header;

				// Set up our custom header with sorting
				columnConfig.header = (info: HeaderContext<T, unknown>) => {
					const { column } = info;
					const isSorted = column.getIsSorted();

					// Create the sort button
					const SortButton = (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								column.toggleSorting(isSorted === "asc")
							}
							className="ml-1 p-0 h-7 w-7 hover:bg-muted/60 transition-colors"
						>
							{isSorted === false ? (
								<TbArrowsSort className="h-4 w-4 text-muted-foreground" />
							) : isSorted === "asc" ? (
								<TbArrowUp className="h-4 w-4 text-primary" />
							) : (
								<TbArrowDown className="h-4 w-4 text-primary" />
							)}
						</Button>
					);

					// Render the original header alongside the sort button
					return (
						<div className="flex items-center font-medium">
							{/* Handle different header types */}
							{typeof originalHeader === "function"
								? flexRender(originalHeader, info)
								: originalHeader}
							{SortButton}
						</div>
					);
				};
			}

			return columnConfig;
		});
	}, [
		props.columnDefs,
		props.sortableColumns,
		props.nonResizableColumns,
		columnHelper,
	]);

	// Memoize the search callback to prevent recreating function on each render
	const memoizedSearchCallback = useCallback((value: string) => {
		setQ(value);
		setPage(1); // Reset to first page when searching
	}, []);

	// Memoize query parameters
	const queryParams = useMemo(
		() => ({
			query: {
				limit: String(limit),
				page: String(page),
				q: q || undefined,
				sort: sortingParam ? JSON.stringify(sortingParam) : undefined,
				filter: filterParam ? JSON.stringify(filterParam) : undefined,
			},
		}),
		[limit, page, q, sortingParam, filterParam],
	);

	const query = useQuery({
		queryKey: [
			...(props.queryKey ?? []),
			page,
			limit,
			q,
			sortingParam,
			filterParam,
		],
		queryFn: () => fetchRPC(props.endpoint(queryParams)),
	});

	const table = useReactTable({
		data: query.data?.data ?? [],
		columns: processedColumnDefs,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		defaultColumn: {
			cell: (props) => <p>{props.getValue() as ReactNode}</p>,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		// All sorting is handled by the server
		manualSorting: true,
		// All filtering is handled by the server
		manualFiltering: true,
		state: {
			sorting,
			columnFilters,
		},
	});

	// Function to render filter inputs based on filter type
	const renderFilterInput = React.useCallback(
		(filter: ColumnFilter) => {
			const filterConfig = props.filterableColumns?.find(
				(fc) => fc.id === filter.id,
			);

			if (!filterConfig) return null;

			return (
				<NativeSelect
					value={filter.value}
					defaultValue={filterConfig.options[0].value}
					onValueChange={(value) => {
						setColumnFilters((prev) => {
							const newFilters = prev.filter(
								(f) => f.id !== filter.id,
							);
							if (value !== undefined) {
								newFilters.push({
									id: filter.id,
									value,
								});
							}
							return newFilters;
						});
					}}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a value" />
					</SelectTrigger>
					<SelectContent>
						{filterConfig.options.map((option) => (
							<SelectItem
								key={String(option.value)}
								value={String(option.value)}
							>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</NativeSelect>
			);
		},
		[props.filterableColumns],
	);

	const handleRemoveFilter = useCallback((id: string) => {
		setColumnFilters((prev) => prev.filter((f) => f.id !== id));
		setActiveFilters((prev) => prev.filter((f) => f !== id));
	}, []);

	const renderFilterChips = React.useCallback(() => {
		return activeFilters.map((filterId) => {
			const filter = columnFilters.find((f) => f.id === filterId);
			if (!filter) return null;

			const filterConfig = props.filterableColumns?.find(
				(fc) => fc.id === filter.id,
			);
			if (!filterConfig) return null;

			const filterValue = filter.value;
			let displayValue = "";

			displayValue =
				filterConfig.options.find((o) => o.value === filterValue)
					?.label ?? String(filterValue);

			return (
				<div
					key={filter.id}
					className="bg-muted flex items-center gap-1 pl-2 pr-1 py-1 rounded-md text-sm relative group"
				>
					<Popover>
						<PopoverTrigger asChild>
							<div className="flex items-center cursor-pointer">
								<span className="font-medium">
									{filterConfig.label}:
								</span>
								<span className="ml-1">{displayValue}</span>
							</div>
						</PopoverTrigger>
						<PopoverContent
							className="w-80 p-4"
							align="start"
							sideOffset={5}
						>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">
										{filterConfig.label}
									</h4>
								</div>
								{renderFilterInput({
									id: filter.id,
									value: filter.value as string,
								})}
							</div>
						</PopoverContent>
					</Popover>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleRemoveFilter(filter.id)}
						className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
					>
						×
					</Button>
				</div>
			);
		});
	}, [
		activeFilters,
		columnFilters,
		props.filterableColumns,
		renderFilterInput,
		handleRemoveFilter,
	]);

	const totalPages = query.data?._metadata?.totalPages ?? 1;
	const currentPage = page;

	if (query.isError) {
		if (query.error instanceof ResponseError) {
			if (query.error.errorCode === "UNAUTHORIZED") {
				return <Navigate to="/403" replace />;
			}
		}
		return <div>Error: {query.error.message}</div>;
	}

	return query.data ? (
		<div className="p-8 bg-muted h-full flex flex-col gap-8">
			{/* Title */}
			<h1 className="text-3xl font-bold">{props.title}</h1>

			{/* Card */}
			<div className="rounded-lg border shadow-lg p-4 bg-background">
				{/* Filter Bar - New UI */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								{withSearchBar && (
									<SearchInput
										onSearch={memoizedSearchCallback}
										initialValue={q}
									/>
								)}
								{/* Only show filter button if there are filterable columns */}
								{props.filterableColumns &&
									props.filterableColumns.length > 0 && (
										<Popover
											open={showFilterMenu}
											onOpenChange={setShowFilterMenu}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="icon"
													className="shrink-0"
												>
													<TbFilter />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-80 p-4"
												align="start"
												sideOffset={5}
											>
												<div className="space-y-4">
													<div className="flex items-center justify-between">
														<h4 className="font-medium">
															Add filter
														</h4>
													</div>
													<div className="grid gap-2">
														{props.filterableColumns?.map(
															(filter) => {
																const isActive =
																	activeFilters.includes(
																		filter.id,
																	);

																return (
																	<div
																		key={
																			filter.id
																		}
																		className="grid grid-cols-[1fr_auto] items-center"
																	>
																		<span className="text-sm">
																			{
																				filter.label
																			}
																		</span>
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() => {
																				if (
																					isActive
																				) {
																					handleRemoveFilter(
																						filter.id,
																					);
																				} else {
																					setColumnFilters(
																						(
																							prev,
																						) => [
																							...prev,
																							{
																								id: filter.id,
																								value: filter
																									.options[0]
																									.value,
																							},
																						],
																					);
																					setActiveFilters(
																						(
																							prev,
																						) => [
																							...prev,
																							filter.id,
																						],
																					);
																				}
																				setShowFilterMenu(
																					false,
																				);
																			}}
																		>
																			{isActive
																				? "Remove"
																				: "Add"}
																		</Button>
																	</div>
																);
															},
														)}
													</div>
												</div>
											</PopoverContent>
										</Popover>
									)}
							</div>
							<div className="flex items-center">
								{props.topContent}
								{props.createButton &&
									createCreateButton(props.createButton)}
							</div>
						</div>
						{activeFilters.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{renderFilterChips()}
							</div>
						)}
					</div>
					<DashboardTable
						table={table}
						columnBorders={props.columnBorders}
					/>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground whitespace-nowrap">
								Page {currentPage} of {totalPages}
							</span>
						</div>
						<Pagination
							value={currentPage}
							total={totalPages}
							onChange={setPage}
						/>
					</div>
				</div>

				{/* The Modals */}
				{props.modals?.map((modal) => {
					const modalKey =
						(modal as { key?: string | number })?.key ??
						`modal-${Math.random()}`;
					const ModalComponent = React.isValidElement(modal) ? (
						modal
					) : (
						<React.Suspense fallback={null}>
							{React.createElement(modal as React.ComponentType)}
						</React.Suspense>
					);
					return <React.Fragment key={modalKey}>{ModalComponent}</React.Fragment>;
				})}
			</div>

			<Outlet />
		</div>
	) : null;
}

// Create a more ergonomic version of PageTemplate that infers types from the endpoint
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
