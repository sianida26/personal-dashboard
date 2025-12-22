import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Card,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Switch,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
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
	const queryClient = useQueryClient();

	// Pagination state
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	// Sorting state
	const [sorting, setSorting] = useState<SortingState>([]);

	// Filter state
	const [filters, setFilters] = useState<FilterState>([]);

	// Search state
	const [searchQuery, setSearchQuery] = useState("");

	// Detail sheet state
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Edit form state
	const [editForm, setEditForm] = useState({
		name: "",
		username: "",
		email: "",
		isEnabled: true,
		password: "",
	});

	// Check if selected user is superadmin
	const isSuperAdmin = selectedUser?.username === "superadmin";

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

	// Handle user detail click
	const handleDetailClick = useCallback((user: User) => {
		setSelectedUser(user);
		setSheetMode("view");
		setEditForm({
			name: user.name,
			username: user.username,
			email: user.email || "",
			isEnabled: user.isEnabled ?? true,
			password: "",
		});
	}, []);

	// Handle edit mode
	const handleEditClick = useCallback(() => {
		setSheetMode("edit");
	}, []);

	// Handle delete confirmation
	const handleDeleteClick = useCallback(() => {
		setShowDeleteDialog(true);
	}, []);

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (userId: string) => {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_BASE_URL}/users/${userId}`,
				{
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({ skipTrash: "false" }),
				},
			);
			if (!response.ok) {
				throw new Error("Failed to delete user");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
			toast.success("User deleted successfully");
			setSelectedUser(null);
			setShowDeleteDialog(false);
		},
		onError: () => {
			toast.error("Failed to delete user");
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async (data: { id: string; updates: typeof editForm }) => {
			// Only include password if it's provided
			const payload: {
				name: string;
				username: string;
				email: string;
				isEnabled: boolean;
				password?: string;
			} = {
				name: data.updates.name,
				username: data.updates.username,
				email: data.updates.email,
				isEnabled: data.updates.isEnabled,
			};
			if (data.updates.password) {
				payload.password = data.updates.password;
			}
			const response = await fetchRPC(
				client.users[":id"].$patch({
					param: { id: data.id },
					json: payload,
				}),
			);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
			toast.success("User updated successfully");
			setSheetMode("view");
			// Refresh selected user data
			if (selectedUser) {
				setSelectedUser({
					...selectedUser,
					...editForm,
				});
			}
		},
		onError: () => {
			toast.error("Failed to update user");
		},
	});

	// Handle save edit
	const handleSaveEdit = useCallback(() => {
		if (selectedUser) {
			updateMutation.mutate({
				id: selectedUser.id,
				updates: editForm,
			});
		}
	}, [selectedUser, editForm, updateMutation]);

	// Handle confirm delete
	const handleConfirmDelete = useCallback(() => {
		if (selectedUser) {
			deleteMutation.mutate(selectedUser.id);
		}
	}, [selectedUser, deleteMutation]);

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
		],
		[page, perPage],
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

			{/* User Detail/Edit Sheet */}
			<Sheet
				open={selectedUser !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedUser(null);
						setSheetMode("view");
					}
				}}
			>
				<SheetContent
					side="right"
					className="w-[400px] sm:w-[540px] overflow-y-auto"
				>
					<SheetHeader>
						<SheetTitle>
							{sheetMode === "view"
								? "User Details"
								: "Edit User"}
						</SheetTitle>
					</SheetHeader>

					{selectedUser && sheetMode === "view" && (
						<div className="mt-6 space-y-6">
							<div className="space-y-4">
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Name
									</Label>
									<p className="mt-1 text-sm">
										{selectedUser.name}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Username
									</Label>
									<p className="mt-1 text-sm">
										{selectedUser.username}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Email
									</Label>
									<p className="mt-1 text-sm">
										{selectedUser.email || "-"}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Status
									</Label>
									<div className="mt-1">
										{selectedUser.isEnabled ? (
											<Badge className="text-green-500 bg-green-100">
												Active
											</Badge>
										) : (
											<Badge className="text-gray-500 bg-gray-100">
												Inactive
											</Badge>
										)}
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Roles
									</Label>
									<div className="mt-1 flex flex-wrap gap-2">
										{selectedUser.roles?.length > 0 ? (
											selectedUser.roles.map((role) => (
												<Badge
													key={role.id}
													variant="secondary"
												>
													{role.name}
												</Badge>
											))
										) : (
											<span className="text-sm text-gray-400">
												No roles
											</span>
										)}
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Created At
									</Label>
									<p className="mt-1 text-sm">
										{selectedUser.createdAt
											? new Date(
													selectedUser.createdAt,
												).toLocaleString("en-US", {
													year: "numeric",
													month: "long",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: "-"}
									</p>
								</div>
							</div>

							<div className="flex gap-2 pt-4 border-t">
								<Button
									onClick={handleEditClick}
									className="flex-1"
									variant="outline"
								>
									<TbPencil className="mr-2 h-4 w-4" />
									Edit
								</Button>
								<Button
									onClick={handleDeleteClick}
									variant="destructive"
									className="flex-1"
								>
									<TbTrash className="mr-2 h-4 w-4" />
									Delete
								</Button>
							</div>
						</div>
					)}

					{selectedUser && sheetMode === "edit" && (
						<div className="mt-6 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={editForm.name}
									onChange={(e) =>
										setEditForm({
											...editForm,
											name: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="username">
									Username
									{isSuperAdmin && (
										<span className="text-xs text-muted-foreground ml-2">
											(Cannot be changed for superadmin)
										</span>
									)}
								</Label>
								<Input
									id="username"
									value={editForm.username}
									onChange={(e) =>
										setEditForm({
											...editForm,
											username: e.target.value,
										})
									}
									disabled={isSuperAdmin}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={editForm.email}
									onChange={(e) =>
										setEditForm({
											...editForm,
											email: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">
									Password
									<span className="text-xs text-muted-foreground ml-2">
										(Optional - leave blank to keep current)
									</span>
								</Label>
								<Input
									id="password"
									type="password"
									value={editForm.password}
									onChange={(e) =>
										setEditForm({
											...editForm,
											password: e.target.value,
										})
									}
									placeholder="Enter new password"
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="enabled"
									checked={editForm.isEnabled}
									onCheckedChange={(checked) =>
										setEditForm({
											...editForm,
											isEnabled: checked,
										})
									}
								/>
								<Label htmlFor="enabled">Enabled</Label>
							</div>
							<div className="flex gap-2 pt-4 border-t">
								<Button
									onClick={() => setSheetMode("view")}
									variant="outline"
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									onClick={handleSaveEdit}
									className="flex-1"
									disabled={updateMutation.isPending}
								>
									{updateMutation.isPending
										? "Saving..."
										: "Save"}
								</Button>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete this user?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action will soft delete the user "
							{selectedUser?.name}". The user can be restored
							later.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteMutation.isPending
								? "Deleting..."
								: "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Outlet />
		</div>
	);
}
