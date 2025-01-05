import React, { ReactNode, useState } from "react";
import { ClientRequestOptions } from "hono";
import { ClientResponse } from "hono/client";
import { PaginatedResponse } from "@repo/data/types";
import { useQuery } from "@tanstack/react-query";
import fetchRPC from "@/utils/fetchRPC";
import {
	ColumnDef,
	ColumnHelper,
	createColumnHelper,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useDebouncedCallback } from "@mantine/hooks";
import { Input } from "./ui/input";
import { TbPlus, TbSearch } from "react-icons/tb";
import { Button } from "./ui/button";
import { Link, Outlet } from "@tanstack/react-router";
import DashboardTable from "./DashboardTable";
import { Select } from "./ui/select";
import {
	Pagination,
	PaginationButton,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "./ui/pagination";

type HonoEndpoint<T extends Record<string, unknown>> = (
	args: Record<string, unknown> & {
		query: {
			page: string;
			limit: string;
			q?: string;
		};
	},
	options?: ClientRequestOptions
) => Promise<ClientResponse<PaginatedResponse<T>>>;

type Props<T extends Record<string, unknown>> = {
	title: string;
	createButton?: string | true | React.ReactNode;
	modals?: React.ReactNode[];
	searchBar?: boolean | React.ReactNode;
	endpoint: HonoEndpoint<T>;
	columnDefs: (columnHelper: ColumnHelper<T>) => ColumnDef<any, any>[];
};

/**
 * Creates a "Create New" button or returns the provided React node.
 *
 * @param property - The property that determines the type of button to create. It can be a boolean, string, or React node.
 * @returns The create button element.
 */
const createCreateButton = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	property: Props<any>["createButton"] = true
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

const getColumnHelper = <T extends Record<string, unknown>>() =>
	createColumnHelper<T>();

export default function PageTemplateV2<T extends Record<string, unknown>>(
	props: Props<T>
) {
	const withSearchBar = Boolean(props.searchBar ?? true);
	const siblings = 1;
	const boundaries = 1;

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [filterOptions, setFilterOptions] = useState({
		page: 0,
		limit: 10,
		q: "",
	});

	const columnHelper = React.useMemo(() => getColumnHelper<T>(), []);

	const query = useQuery({
		queryKey: [props.endpoint.name, props.endpoint.arguments],
		queryFn: () =>
			fetchRPC(
				props.endpoint({
					query: {
						limit: String(filterOptions.limit),
						page: String(filterOptions.page),
						q: filterOptions.q,
					},
				})
			),
	});

	const table = useReactTable({
		data: query.data?.data ?? [],
		columns: props.columnDefs(columnHelper),
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
							// defaultValue="10"
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
