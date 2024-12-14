import { Link, Outlet } from "@tanstack/react-router";
import React, { ReactNode, useState } from "react";
import { TbPlus, TbSearch } from "react-icons/tb";
import DashboardTable from "./DashboardTable";
import {
	ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	QueryKey,
	UseQueryOptions,
	keepPreviousData,
	useQuery,
} from "@tanstack/react-query";
import { useDebouncedCallback } from "@mantine/hooks";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
	PaginationButton,
} from "./ui/pagination";

type PaginatedResponse<T extends Record<string, unknown>> = {
	data: Array<T>;
	_metadata: {
		currentPage: number;
		totalPages: number;
		perPage: number;
		totalItems: number;
	};
};

//ref: https://x.com/TkDodo/status/1491451513264574501
type Props<
	TQueryKey extends QueryKey,
	TQueryFnData extends Record<string, unknown>,
	TError,
	TData extends Record<string, unknown> = TQueryFnData,
> = {
	title: string;
	createButton?: string | true | React.ReactNode;
	modals?: React.ReactNode[];
	searchBar?: boolean | React.ReactNode;
	queryOptions: (
		page: number,
		limit: number,
		q?: string
	) => UseQueryOptions<
		PaginatedResponse<TQueryFnData>,
		TError,
		PaginatedResponse<TData>,
		TQueryKey
	>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	columnDefs: ColumnDef<any>[];
};

/**
 * Creates a "Create New" button or returns the provided React node.
 *
 * @param property - The property that determines the type of button to create. It can be a boolean, string, or React node.
 * @returns The create button element.
 */
const createCreateButton = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	property: Props<any, any, any>["createButton"] = true
) => {
	if (property === true) {
		return (
			//@ts-expect-error global search param for create route
			<Link to={"./create"}>
				<Button leftSection={<TbPlus />}>Create New</Button>
			</Link>
		);
	} else if (typeof property === "string") {
		return (
			//@ts-expect-error global search param for create route
			<Link to={"./create"}>
				<Button leftSection={<TbPlus />}>{property}</Button>
			</Link>
		);
	} else {
		return property;
	}
};

/**
 * PageTemplate component for displaying a paginated table with search and filter functionality.
 
 * @param props - The properties object.
 * @returns The rendered PageTemplate component.
 */
export default function PageTemplate<
	TQueryKey extends QueryKey,
	TQueryFnData extends Record<string, unknown>,
	TError,
	TData extends Record<string, unknown> = TQueryFnData,
>(props: Props<TQueryKey, TQueryFnData, TError, TData>) {
	const [filterOptions, setFilterOptions] = useState({
		page: 0,
		limit: 10,
		q: "",
	});

	const [sorting, setSorting] = React.useState<SortingState>([]);

	const withSearchBar = Boolean(props.searchBar ?? true);

	const siblings = 1;
	const boundaries = 1;

	const query = useQuery({
		...(typeof props.queryOptions === "function"
			? props.queryOptions(
					filterOptions.page,
					filterOptions.limit,
					filterOptions.q
				)
			: props.queryOptions),
		placeholderData: keepPreviousData,
	});

	const table = useReactTable({
		data: query.data?.data ?? [],
		columns: props.columnDefs,
		getCoreRowModel: getCoreRowModel(),
		defaultColumn: {
			cell: (props) => <p>{props.getValue() as ReactNode}</p>,
		},
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	const handleSearchQueryChange = useDebouncedCallback((value: string) => {
		setFilterOptions((prev) => ({
			page: 0,
			limit: prev.limit,
			q: value,
		}));
	}, 500);

	const handlePageChange = (page: number) => {
		setFilterOptions((prev) => ({
			page: page - 1,
			limit: prev.limit,
			q: prev.q,
		}));
	};

	const totalPages = query.data?._metadata.totalPages ?? 1;
	const currentPage = filterOptions.page + 1;

	return (
		<div className="p-8 bg-muted h-full flex flex-col gap-8">
			{/* Title */}
			<h1 className="text-3xl font-bold">{props.title}</h1>

			{/* Card */}
			<div className="rounded-lg border shadow-lg p-4 bg-background">
				{/* Top Section */}
				<div className="flex justify-between">
					{/* Left */}
					<div>
						{/* Search */}
						{withSearchBar && (
							<div className="flex">
								<Input
									leftSection={<TbSearch />}
									value={filterOptions.q}
									onChange={(e) =>
										handleSearchQueryChange(e.target.value)
									}
									placeholder="Search..."
									className=""
								/>
							</div>
						)}
					</div>

					{/* Right */}
					<div>{createCreateButton(props.createButton)}</div>
				</div>

				{/* Table Functionality */}
				<div className="flex flex-col">
					{/* Table */}
					<div className="mt-4">
						<DashboardTable table={table} />
					</div>

					{/* Pagination */}
					{query.data && (
						<div className="pt-4 flex-wrap flex items-center gap-4">
							<Select
								defaultValue="10"
								// onChange={(value) =>
								// 	setFilterOptions((prev) => ({
								// 		page: prev.page,
								// 		limit: parseInt(value ?? "10"),
								// 		q: prev.q,
								// 	}))
								// }
							/>
							<Pagination
							// value={currentPage}
							// total={totalPages}
							// onChange={handlePageChange}
							// siblings={1}
							// boundaries={1}
							>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() =>
												currentPage > 1 &&
												handlePageChange(
													currentPage - 1
												)
											}
											disabled={currentPage === 1}
										/>
									</PaginationItem>
									{[...Array(totalPages)].map((_, index) => {
										const pageIndex = index + 1;
										if (
											pageIndex === currentPage ||
											pageIndex <= boundaries ||
											pageIndex >
												totalPages - boundaries ||
											Math.abs(pageIndex - currentPage) <=
												siblings
										) {
											return (
												<PaginationItem key={index}>
													<PaginationButton
														isActive={
															currentPage ===
															pageIndex
														}
														onClick={() =>
															handlePageChange(
																pageIndex
															)
														}
													>
														{pageIndex}
													</PaginationButton>
												</PaginationItem>
											);
										} else if (
											pageIndex ===
												currentPage + siblings + 1 ||
											pageIndex ===
												currentPage - siblings - 1
										) {
											return (
												<PaginationItem
													key={`ellipsis-${index}`}
												>
													<PaginationEllipsis />
												</PaginationItem>
											);
										}
										return null;
									})}
									<PaginationItem>
										<PaginationNext
											onClick={() =>
												handlePageChange(
													currentPage + 1
												)
											}
											disabled={
												currentPage === totalPages
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
							<p>
								Showing {query.data.data.length} of{" "}
								{query.data._metadata.totalItems}
							</p>
						</div>
					)}
				</div>

				{/* The Modals */}
				{props.modals?.map((modal, index) => (
					<React.Fragment key={index}>{modal}</React.Fragment>
				))}
			</div>

			<Outlet />
		</div>
	);
}
