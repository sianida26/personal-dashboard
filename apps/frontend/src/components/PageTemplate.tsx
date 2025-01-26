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
import { Link, Navigate, Outlet } from "@tanstack/react-router";
import DashboardTable from "./DashboardTable";
import { Select } from "./ui/select";
import { Pagination } from "./ui/pagination";
import ResponseError from "@/errors/ResponseError";

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
	queryKey?: any[];
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

export default function PageTemplate<T extends Record<string, unknown>>(
	props: Props<T>
) {
	const withSearchBar = Boolean(props.searchBar ?? true);

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [page, setPage] = useState(0);
	const [limit, setLimit] = useState(10);
	const [q, setQ] = useState("");

	const columnHelper = React.useMemo(() => getColumnHelper<T>(), []);

	console.log("filterOptions");

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
		setQ(value);
	}, 500);

	const handlePageChange = (page: number) => {
		setPage(page - 1);
	};

	const totalPages = query.data?._metadata.totalPages ?? 1;
	const currentPage = page + 1;

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
					<div>
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
								label="Items per page"
								defaultValue={String(limit)}
								onValueChange={(value) => {
									setPage(0);
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
				{props.modals?.map((modal, index) => (
					<React.Fragment key={index}>{modal}</React.Fragment>
				))}
			</div>

			<Outlet />
		</div>
	) : query.error ? (
		<div>Error: {query.error.message}</div>
	) : (
		<div>Loading...</div>
	);
}
