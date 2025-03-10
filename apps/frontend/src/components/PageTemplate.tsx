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
	type Column,
	type HeaderContext,
	flexRender,
} from "@tanstack/react-table";
import type { ClientRequestOptions } from "hono";
import type { ClientResponse } from "hono/client";
import React, { type ReactNode, useState } from "react";
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
	Select,
	DatePicker,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui";
import { format } from "date-fns";

// Define filter types
export type FilterType = "text" | "checkbox" | "date" | "daterange" | "select";

export type FilterConfig<T> = {
	id: Extract<keyof T, string>;
	type: FilterType;
	options?: { label: string; value: unknown }[];
	// Date range format for filter validation
	dateFormat?: string;
};

// For date range filters
export type DateRange = {
	from: Date | undefined;
	to: Date | undefined;
};

type HonoEndpoint<T extends Record<string, unknown>> = (
	args: Record<string, unknown> & {
		query: {
			page: string;
			limit: string;
			q?: string;
		};
	},
	options?: ClientRequestOptions,
) => Promise<ClientResponse<PaginatedResponse<T>>>;

type Props<T extends Record<string, unknown>> = {
	title: string;
	createButton?: string | true | React.ReactNode;
	modals?: React.ReactNode[];
	searchBar?: boolean | React.ReactNode;
	endpoint: HonoEndpoint<T>;
	// biome-ignore lint/suspicious/noExplicitAny: any is used to allow for any type of columnDefs
	columnDefs: (columnHelper: ColumnHelper<T>) => ColumnDef<any, any>[];
	// biome-ignore lint/suspicious/noExplicitAny: any is used to allow for any type of queryKey
	queryKey?: any[];
	// Define which columns can be sorted
	sortableColumns?: Extract<keyof T, string>[];
	// Define which columns can be filtered and how
	filterableColumns?: FilterConfig<T>[];
	// Whether to show column borders
	columnBorders?: boolean;
	// Define which columns cannot be resized (all columns are resizable by default)
	nonResizableColumns?: Extract<keyof T, string>[];
};

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

export default function PageTemplate<T extends Record<string, unknown>>(
	props: Props<T>,
) {
	const withSearchBar = Boolean(props.searchBar ?? true);

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [q, setQ] = useState("");
	const [activeFilters, setActiveFilters] = useState<string[]>([]);

	const columnHelper = React.useMemo(() => getColumnHelper<T>(), []);

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

	const query = useQuery({
		queryKey: [...(props.queryKey ?? []), page, limit, q],
		queryFn: () =>
			fetchRPC(
				props.endpoint({
					query: {
						limit: String(limit),
						page: String(page),
						q: q,
					},
				}),
			),
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
		state: {
			sorting,
			columnFilters,
		},
	});

	const handleSearchQueryChange = useDebouncedCallback((value: string) => {
		setQ(value);
	}, 500);

	const handlePageChange = (page: number) => {
		setPage(page);
	};
	
	// Toggle a filter in the active filters list
	const toggleFilter = (filterId: string) => {
		setActiveFilters((prev) =>
			prev.includes(filterId)
				? prev.filter((id) => id !== filterId)
				: [...prev, filterId],
		);
	};

	// Function to render filter inputs based on filter type
	const renderFilterInput = (
		filter: FilterConfig<T>,
		column: Column<T, unknown>,
	) => {
		const currentFilterValue = column.getFilterValue();

		switch (filter.type) {
			case "text":
				return (
					<Input
						value={(currentFilterValue as string) ?? ""}
						onChange={(e) => column.setFilterValue(e.target.value)}
						placeholder={`Filter ${column.id}`}
						className="mb-2"
					/>
				);

			case "select":
				return (
					<Select
						defaultValue={(currentFilterValue as string) ?? ""}
						onValueChange={(value) => column.setFilterValue(value)}
						data={
							filter.options?.map((opt) => ({
								label: opt.label,
								value: String(opt.value),
							})) ?? []
						}
						placeholder={`Select ${column.id}`}
					/>
				);

			case "checkbox":
				if (!filter.options) return null;
				return (
					<div className="flex flex-col gap-1 mb-2">
						{filter.options.map((option) => (
							<label
								key={String(option.value)}
								className="flex items-center gap-2"
							>
								<input
									type="checkbox"
									checked={
										Array.isArray(currentFilterValue)
											? (
													currentFilterValue as unknown[]
												).includes(option.value)
											: false
									}
									onChange={(e) => {
										const values = Array.isArray(
											currentFilterValue,
										)
											? [
													...(currentFilterValue as unknown[]),
												]
											: [];

										if (e.target.checked) {
											column.setFilterValue([
												...values,
												option.value,
											]);
										} else {
											column.setFilterValue(
												values.filter(
													(v) => v !== option.value,
												),
											);
										}
									}}
								/>
								{option.label}
							</label>
						))}
					</div>
				);

			case "date":
				return (
					<div className="mb-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal"
								>
									{currentFilterValue instanceof Date ? (
										format(
											currentFilterValue as Date,
											filter.dateFormat ?? "PPP",
										)
									) : (
										<span className="text-muted-foreground">
											Pick a date
										</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0"
								align="start"
							>
								<DatePicker
									mode="single"
									value={currentFilterValue as Date}
									onChange={(date: Date | null) =>
										column.setFilterValue(date)
									}
								/>
							</PopoverContent>
						</Popover>
					</div>
				);

			case "daterange": {
				const dateRange = (currentFilterValue as DateRange) || {
					from: undefined,
					to: undefined,
				};
				return (
					<div className="mb-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal"
								>
									{dateRange.from ? (
										dateRange.to ? (
											<>
												{format(
													dateRange.from,
													filter.dateFormat ?? "PPP",
												)}{" "}
												-{" "}
												{format(
													dateRange.to,
													filter.dateFormat ?? "PPP",
												)}
											</>
										) : (
											format(
												dateRange.from,
												filter.dateFormat ?? "PPP",
											)
										)
									) : (
										<span className="text-muted-foreground">
											Pick date range
										</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0"
								align="start"
							>
								<DatePicker
									mode="range"
									value={
										dateRange.from && dateRange.to
											? {
													from: dateRange.from,
													to: dateRange.to,
												}
											: undefined
									}
									onChange={(range: {
										from: Date;
										to: Date | null;
									}) =>
										column.setFilterValue({
											from: range.from,
											to: range.to,
										})
									}
								/>
							</PopoverContent>
						</Popover>
					</div>
				);
			}

			default:
				return null;
		}
	};

	const totalPages = query.data?._metadata?.totalPages ?? 1;
	const currentPage = page;

	if (query.isError) {
		if (query.error instanceof ResponseError) {
			if (query.error.errorCode === "UNAUTHORIZED") {
				return <Navigate to="/403" replace />;
			}
		}
	}

	return query.data ? (
		<div className="p-8 bg-muted h-full flex flex-col gap-8">
			{/* Title */}
			<h1 className="text-3xl font-bold">{props.title}</h1>

			{/* Card */}
			<div className="rounded-lg border shadow-lg p-4 bg-background">
				{/* Top Section */}
				<div className="flex justify-between">
					{/* Left */}
					<div className="flex items-center gap-4">
						{/* Search */}
						{withSearchBar && (
							<div className="flex">
								<Input
									leftSection={<TbSearch />}
									value={q}
									onChange={(e) =>
										handleSearchQueryChange(e.target.value)
									}
									placeholder="Search..."
									className=""
								/>
							</div>
						)}

						{/* Filter Button - Only show if filterableColumns are defined */}
						{props.filterableColumns &&
							props.filterableColumns.length > 0 && (
								<div className="relative">
									<Button
										variant="outline"
										onClick={() =>
											setActiveFilters((prev) =>
												prev.length
													? []
													: (props.filterableColumns?.map(
															(f) => f.id,
														) ?? []),
											)
										}
										className="flex items-center gap-2"
									>
										<TbFilter />
										{activeFilters.length
											? `Filters (${activeFilters.length})`
											: "Filters"}
									</Button>
								</div>
							)}
					</div>

					{/* Right */}
					<div>{createCreateButton(props.createButton)}</div>
				</div>

				{/* Active Filters */}
				{props.filterableColumns && activeFilters.length > 0 && (
					<div className="mt-4 p-4 border rounded-md">
						<div className="flex justify-between items-center mb-2">
							<h3 className="font-medium">Active Filters</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setActiveFilters([])}
							>
								Clear All
							</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{props.filterableColumns
								.filter((filter) =>
									activeFilters.includes(filter.id),
								)
								.map((filter) => {
									const column = table.getColumn(filter.id);
									if (!column) return null;

									return (
										<div
											key={filter.id}
											className="border p-2 rounded"
										>
											<div className="flex justify-between items-center mb-1">
												<span className="font-medium">
													{
														column.columnDef
															.header as string
													}
												</span>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														toggleFilter(filter.id)
													}
													className="h-6 w-6 p-0"
												>
													×
												</Button>
											</div>
											{renderFilterInput(filter, column)}
										</div>
									);
								})}
						</div>
					</div>
				)}

				{/* Table Functionality */}
				<div className="flex flex-col">
					{/* Table */}
					<div className="mt-4">
						<DashboardTable
							table={table}
							columnBorders={props.columnBorders}
						/>
					</div>

					{/* Pagination */}
					{query.data && (
						<div className="pt-4 flex-wrap flex items-center gap-4">
							<Select
								label="Items per page"
								defaultValue={String(limit)}
								onValueChange={(value) => {
									setPage(1);
									setLimit(Number(value));
								}}
								data={[
									"5",
									"10",
									"20",
									"50",
									"100",
									"200",
									"500",
								]}
							/>

							<p>
								Showing {query.data.data.length} of{" "}
								{query.data._metadata.totalItems}
							</p>
						</div>
					)}
				</div>

				<Pagination
					total={totalPages}
					value={currentPage}
					onChange={handlePageChange}
				/>

				{/* The Modals */}
				{props.modals?.map((modal) => {
					const modalKey =
						(modal as { key?: string | number })?.key ??
						`modal-${Math.random()}`;
					return (
						<React.Fragment key={modalKey}>{modal}</React.Fragment>
					);
				})}
			</div>

			<Outlet />
		</div>
	) : null;
}
