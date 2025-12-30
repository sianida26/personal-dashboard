import {
	Badge,
	Button,
	Card,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import {
	type AdaptiveColumnDef,
	AdaptiveTable,
	type FilterState,
} from "@/components/AdaptiveTable";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute("/_dashboardLayout/users")({
	component: UsersPage,
});

// Define the User type based on API response
interface User {
	id: string;
	name: string;
	email: string | null;
	username: string;
	isEnabled: boolean | null;
	createdAt: string | null;
	updatedAt: string | null;
	roles: Array<{ id: string; name: string; code: string }>;
}

export default function UsersPage() {
	const navigate = useNavigate();

	// Pagination state
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	// Sorting state
	const [sorting, setSorting] = useState<SortingState>([]);

	// Filter state
	const [filters, setFilters] = useState<FilterState>([]);

	// Search state
	const [searchQuery, setSearchQuery] = useState("");

	// Build query parameters for API
	const queryParams = useMemo(() => {
		const params: {
			page: string;
			limit: string;
			q?: string;
			sort?: string;
			filter?: string;
		} = {
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

		return params;
	}, [page, perPage, sorting, filters, searchQuery]);

	// Fetch users data
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["users", queryParams],
		queryFn: async () => {
			const response = await fetchRPC(
				client.users.$get({
					query: queryParams,
				}),
			);
			return response;
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

	const handleSearchChange = useCallback((value: string) => {
		setSearchQuery(value);
		setPage(1); // Reset to first page when search changes
	}, []);

	// Handle user detail click - NAVIGATE TO DETAIL ROUTE
	const handleDetailClick = useCallback((user: User) => {
		navigate({
			to: "/users/detail/$userId",
			params: { userId: user.id },
		});
	}, [navigate]);

	// Column definitions
	const columns = useMemo<AdaptiveColumnDef<User>[]>(
		() => [
			{
				id: "rowNumber",
				header: "#",
				cell: ({ row }) => (page - 1) * perPage + row.index + 1,
				size: 60,
				minSize: 60,
				maxSize: 80,
				enableSorting: false,
				filterable: false,
				resizable: false,
			},
			{
				accessorKey: "name",
				header: "Name",
				cell: (info) => info.getValue(),
				sortable: true,
				size: 200,
				minSize: 150,
			},
			{
				accessorKey: "username",
				header: "Username",
				cell: (info) => info.getValue(),
				sortable: true,
				size: 150,
				minSize: 120,
			},
			{
				accessorKey: "isEnabled",
				header: "Status",
				cell: (info) =>
					info.getValue() ? (
						<Badge className="text-green-500 bg-green-100">
							Active
						</Badge>
					) : (
						<Badge className="text-gray-500 bg-gray-100">
							Inactive
						</Badge>
					),
				filterType: "select",
				options: [
					{ label: "Active", value: "Active" },
					{ label: "Inactive", value: "Inactive" },
				],
				sortable: true,
				size: 120,
				minSize: 100,
			},
			{
				accessorKey: "roles",
				header: "Roles",
				cell: (info) => {
					const roles = info.row.original.roles;
					if (!roles || roles.length === 0) {
						return <span className="text-gray-400">No roles</span>;
					}
					return (
						<div className="flex flex-wrap gap-1">
							{roles.slice(0, 3).map((role) => (
								<Badge
									key={role.id}
									variant="secondary"
									className="text-xs"
								>
									{role.name}
								</Badge>
							))}
							{roles.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{roles.length - 3}
								</Badge>
							)}
						</div>
					);
				},
				filterable: false,
				enableSorting: false,
				size: 200,
				minSize: 150,
			},
			{
				accessorKey: "createdAt",
				header: "Created At",
				cell: (info) => {
					const date = info.getValue() as string | null;
					return date
						? new Date(date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric",
							})
						: "-";
				},
				sortable: true,
				size: 150,
				minSize: 120,
			},
			{
				id: "actions",
				header: "Actions",
				size: 120,
				minSize: 120,
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							size="icon"
							variant="ghost"
							onClick={(e) => {
								e.stopPropagation();
								navigate({
									to: "/users/edit/$userId",
									params: { userId: row.original.id },
								});
							}}
						>
							<TbPencil />
						</Button>
						<Button
							size="icon"
							variant="ghost"
							className="text-destructive hover:text-destructive"
							onClick={(e) => {
								e.stopPropagation();
								navigate({
									to: "/users/delete/$userId",
									params: { userId: row.original.id },
								});
							}}
						>
							<TbTrash />
						</Button>
					</div>
				),
			},
		],
		[page, perPage, navigate],
	);

	const users = data?.data ?? [];
	const metadata = data?._metadata;
	const totalPages = metadata?.totalPages ?? 1;
	const totalItems = metadata?.totalItems ?? 0;

	return (
		<div className="p-6 h-full flex flex-col overflow-hidden">
			<Card className="flex-1 p-6 flex flex-col overflow-hidden">
				<AdaptiveTable
					columns={columns}
					data={users}
					title="Users"
					// Server-side pagination
					pagination
					paginationType="server"
					currentPage={page}
					maxPage={totalPages}
					recordsTotal={totalItems}
					onPaginationChange={handlePaginationChange}
					// Server-side sorting
					sortable
					onSortingChange={handleSortingChange}
					// Server-side filtering
					filterable
					onFiltersChange={handleFiltersChange}
					// Server-side search
					search
					onSearchChange={handleSearchChange}
					// Loading states
					isLoading={isLoading}
					isRevalidating={isFetching && !isLoading}
					// Table features
					columnOrderable
					columnResizable
					rowVirtualization
					showDetail
					onDetailClick={handleDetailClick}
					saveState="users-table"
					// Header action
					headerActions={
						<Link to="/users/create">
							<Button leftSection={<TbPlus />}>
								Create User
							</Button>
						</Link>
					}
				/>
			</Card>

			<Outlet />
		</div>
	);
}
