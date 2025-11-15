import { type PermissionCode, permissions } from "@repo/data";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { useToast } from "@repo/ui/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	TbArrowLeft,
	TbCalendar,
	TbCopy,
	TbEdit,
	TbMail,
	TbShield,
	TbTrash,
	TbUser,
	TbUsers,
} from "react-icons/tb";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout/roles/view/$roleId")({
	component: RouteComponent,
	staticData: {
		title: "View Role",
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { roleId: id } = Route.useParams();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const detailEndpoint = client.roles[":id"].$get;

	const { data: roleData, isLoading } = useQuery({
		queryKey: ["roles", { id }],
		queryFn: () => fetchRPC(detailEndpoint({ param: { id } })),
	});

	// Fetch users assigned to this role
	const { data: usersData, isLoading: isUsersLoading } = useQuery({
		queryKey: ["users", "role", id],
		queryFn: () =>
			fetchRPC(
				client.users.$get({
					query: {
						page: "1",
						limit: "1000",
						filter: JSON.stringify([
							{
								id: "roles",
								value: roleData?.code || "",
							},
						]),
					},
				}),
			),
		enabled: !!roleData?.code,
	});

	const deleteMutation = useMutation({
		mutationKey: ["delete-role", id],
		mutationFn: async () => {
			return await fetchRPC(
				client.roles[":id"].$delete({
					param: { id },
				}),
			);
		},
		onError: (error: unknown) => {
			if (error instanceof Error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: error.message,
				});
			}
		},
		onSuccess: () => {
			toast({
				description: "Role deleted successfully.",
				className: "bg-green-300 text-green-800",
			});
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			navigate({ to: "/roles" });
		},
	});

	const handleDeleteRole = () => {
		deleteMutation.mutate();
		setIsDeleteModalOpen(false);
	};

	const handleDuplicateRole = () => {
		navigate({
			to: "/roles/create",
			search: {
				template: id,
			},
		});
	};

	const groupedPermissions = permissions.reduce(
		(acc, permission) => {
			const [group] = permission.split(".");
			if (!acc[group]) {
				acc[group] = [];
			}
			acc[group].push(permission);
			return acc;
		},
		{} as Record<string, PermissionCode[]>,
	);

	if (isLoading) {
		return (
			<div className="container mx-auto py-6 space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
						<div className="space-y-2">
							<div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
							<div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
						</div>
					</div>
					<div className="flex gap-2">
						<div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
						<div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
						<div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
				<div className="space-y-4">
					<div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
					<div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
				</div>
			</div>
		);
	}

	if (!roleData) {
		return (
			<div className="container mx-auto py-6">
				<Card>
					<CardContent className="py-12">
						<div className="text-center">
							<TbShield className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-4 text-lg font-medium text-gray-900">
								Role not found
							</h3>
							<p className="mt-2 text-sm text-gray-500">
								The role you're looking for doesn't exist or has
								been deleted.
							</p>
							<Button
								className="mt-4"
								onClick={() => navigate({ to: "/roles" })}
							>
								<TbArrowLeft className="mr-2 h-4 w-4" />
								Back to Roles
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/roles" })}
					>
						<TbArrowLeft className="mr-2 h-4 w-4" />
						Back to Roles
					</Button>
					<div>
						<h1 className="text-2xl font-bold">{roleData.name}</h1>
						{roleData.code && (
							<p className="text-sm text-muted-foreground">
								Code: {roleData.code}
							</p>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={handleDuplicateRole}
						className="border-blue-200 text-blue-600 hover:bg-blue-50"
					>
						<TbCopy className="mr-2 h-4 w-4" />
						Duplicate
					</Button>
					<Button
						variant="outline"
						onClick={() =>
							navigate({
								to: "/roles/edit/$roleId",
								params: { roleId: id },
							})
						}
						className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
					>
						<TbEdit className="mr-2 h-4 w-4" />
						Edit Role
					</Button>
					<AlertDialog
						open={isDeleteModalOpen}
						onOpenChange={setIsDeleteModalOpen}
					>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								className="border-red-200 text-red-600 hover:bg-red-50"
							>
								<TbTrash className="mr-2 h-4 w-4" />
								Delete Role
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Are you absolutely sure?
								</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will
									permanently delete the role{" "}
									<strong className="text-foreground">
										{roleData.name}
									</strong>{" "}
									and remove all associated permissions.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsDeleteModalOpen(false)}
									disabled={deleteMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteRole}
									disabled={deleteMutation.isPending}
								>
									{deleteMutation.isPending
										? "Deleting..."
										: "Delete Role"}
								</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
			{/* Role Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TbShield className="h-5 w-5" />
						Role Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<span className="text-sm font-medium text-gray-500">
								Name
							</span>
							<p className="text-sm font-medium">
								{roleData.name}
							</p>
						</div>
						<div>
							<span className="text-sm font-medium text-gray-500">
								Code
							</span>
							<p className="text-sm font-medium">
								{roleData.code || "Not specified"}
							</p>
						</div>
						<div>
							<span className="text-sm font-medium text-gray-500">
								Permissions
							</span>
							<p className="text-sm font-medium">
								{roleData.permissions?.length || 0} permissions
							</p>
						</div>
					</div>
					<div>
						<span className="text-sm font-medium text-gray-500">
							Description
						</span>
						<p className="text-sm">
							{roleData.description || "No description provided"}
						</p>
					</div>
				</CardContent>
			</Card>
			{/* Permissions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TbUsers className="h-5 w-5" />
						Permissions ({roleData.permissions?.length || 0})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{roleData.permissions && roleData.permissions.length > 0 ? (
						<div className="space-y-6">
							{Object.entries(groupedPermissions).map(
								([group, groupPermissions]) => {
									const assignedPermissions =
										groupPermissions.filter((p) =>
											roleData.permissions.includes(p),
										);

									if (assignedPermissions.length === 0)
										return null;

									return (
										<div
											key={group}
											className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-gray-50 to-gray-100"
										>
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-semibold capitalize flex items-center gap-2">
													{group.replace("-", " ")}
													<Badge
														variant="outline"
														className="text-xs"
													>
														{
															assignedPermissions.length
														}{" "}
														of{" "}
														{
															groupPermissions.length
														}
													</Badge>
													{assignedPermissions.length ===
														groupPermissions.length && (
														<Badge
															variant="default"
															className="text-xs bg-green-100 text-green-800"
														>
															Complete
														</Badge>
													)}
												</h3>
											</div>
											<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
												{assignedPermissions.map(
													(permission) => (
														<Badge
															key={permission}
															variant="secondary"
															className="text-xs justify-start bg-blue-50 text-blue-700 border-blue-200"
														>
															{permission
																.split(".")[1]
																?.replace(
																	/([A-Z])/g,
																	" $1",
																)
																.trim() ||
																permission}
														</Badge>
													),
												)}
											</div>
										</div>
									);
								},
							)}
						</div>
					) : (
						<div className="text-center py-12">
							<TbShield className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-4 text-lg font-medium text-gray-900">
								No permissions assigned
							</h3>
							<p className="mt-2 text-sm text-gray-500">
								This role doesn't have any permissions assigned
								to it.
							</p>
							<Button
								className="mt-4"
								onClick={() =>
									navigate({
										to: "/roles/edit/$roleId",
										params: { roleId: id },
									})
								}
							>
								<TbEdit className="mr-2 h-4 w-4" />
								Edit Role
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
			{/* Users with this role */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TbUser className="h-5 w-5" />
						Users with this role ({usersData?.data?.length || 0})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isUsersLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 3 }, (_, i) => (
								<div
									key={`user-skeleton-${i + 1}`}
									className="flex items-center space-x-4 p-3 border rounded-lg"
								>
									<div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
									<div className="flex-1 space-y-1">
										<div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
										<div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
									</div>
								</div>
							))}
						</div>
					) : usersData?.data && usersData.data.length > 0 ? (
						<div className="space-y-3">
							{usersData.data.map((user) => (
								<div
									key={user.id}
									className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-center space-x-4">
										<div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
											<TbUser className="h-5 w-5 text-blue-600" />
										</div>
										<div>
											<h4 className="text-sm font-medium">
												{user.name}
											</h4>
											<div className="flex items-center gap-4 text-xs text-gray-500">
												<span className="flex items-center gap-1">
													<TbMail className="h-3 w-3" />
													{user.email}
												</span>
												<span className="flex items-center gap-1">
													<TbCalendar className="h-3 w-3" />
													{user.createdAt
														? new Date(
																user.createdAt,
															).toLocaleDateString()
														: "N/A"}
												</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												user.isEnabled
													? "default"
													: "secondary"
											}
											className={
												user.isEnabled
													? "bg-green-100 text-green-800"
													: ""
											}
										>
											{user.isEnabled
												? "Active"
												: "Disabled"}
										</Badge>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												navigate({
													to: "/users/detail/$userId",
													params: { userId: user.id },
												})
											}
										>
											View
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<TbUsers className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-4 text-lg font-medium text-gray-900">
								No users assigned
							</h3>
							<p className="mt-2 text-sm text-gray-500">
								No users have been assigned to this role yet.
							</p>
							<Button
								className="mt-4"
								onClick={() => navigate({ to: "/users" })}
							>
								<TbUsers className="mr-2 h-4 w-4" />
								View All Users
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
