import {
	Button,
	Card,
	Flex,
	Pagination,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import React, { ReactNode, useState } from "react";
import { TbPlus, TbSearch } from "react-icons/tb";
import DashboardTable from "./DashboardTable";
import {
	ColumnDef,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	QueryKey,
	UseQueryOptions,
	keepPreviousData,
	useQuery,
} from "@tanstack/react-query";
import { useDebouncedCallback } from "@mantine/hooks";

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
			<Button leftSection={<TbPlus />} component={Link} to="?create=true">
				Create New
			</Button>
		);
	} else if (typeof property === "string") {
		return (
			<Button leftSection={<TbPlus />} component={Link} to="?create=true">
				{property}
			</Button>
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

	const withSearchBar = Boolean(props.searchBar ?? true);

	// const [deboucedSearchQuery] = useDebouncedValue(filterOptions.q, 500);

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
			cell: (props) => <Text>{props.getValue() as ReactNode}</Text>,
		},
	});

	/**
	 * Handles the change in search query input with debounce.
	 *
	 * @param value - The new search query value.
	 */
	const handleSearchQueryChange = useDebouncedCallback((value: string) => {
		setFilterOptions((prev) => ({
			page: 0,
			limit: prev.limit,
			q: value,
		}));
	}, 500);

	/**
	 * Handles the change in page number.
	 *
	 * @param page - The new page number.
	 */
	const handlePageChange = (page: number) => {
		setFilterOptions((prev) => ({
			page: page - 1,
			limit: prev.limit,
			q: prev.q,
		}));
	};

	return (
		<Stack>
			<Title order={1}>{props.title}</Title>
			<Card>
				{/* Top Section */}
				<Flex justify="flex-end">
					{createCreateButton(props.createButton)}
				</Flex>

				{/* Table Functionality */}
				<div className="flex flex-col">
					{/* Search */}
					{withSearchBar && (
						<div className="flex pb-4">
							<TextInput
								leftSection={<TbSearch />}
								value={filterOptions.q}
								onChange={(e) =>
									handleSearchQueryChange(e.target.value)
								}
								placeholder="Search..."
							/>
						</div>
					)}

					{/* Table */}
					<DashboardTable table={table} />

					{/* Pagination */}
					{query.data && (
						<div className="pt-4 flex-wrap flex items-center gap-4">
							<Select
								label="Per Page"
								data={["5", "10", "50", "100", "500", "1000"]}
								allowDeselect={false}
								defaultValue="10"
								searchValue={filterOptions.limit.toString()}
								onChange={(value) =>
									setFilterOptions((prev) => ({
										page: prev.page,
										limit: parseInt(value ?? "10"),
										q: prev.q,
									}))
								}
								checkIconPosition="right"
								className="w-20"
							/>
							<Pagination
								value={filterOptions.page + 1}
								total={query.data._metadata.totalPages}
								onChange={handlePageChange}
							/>
							<Text c="dimmed" size="sm">
								Showing {query.data.data.length} of{" "}
								{query.data._metadata.totalItems}
							</Text>
						</div>
					)}
				</div>

				{/* The Modals */}
				{props.modals?.map((modal, index) => (
					<React.Fragment key={index}>{modal}</React.Fragment>
				))}
			</Card>
		</Stack>
	);
}
