import {
	Badge,
	Button,
	Card,
} from "@repo/ui";
import { createLazyFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import {
	type AdaptiveColumnDef,
} from "@/components/AdaptiveTable";
import ServerDataTable from "@/components/ServerDataTable";
import client from "@/honoClient";

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

	// Column definitions
	const columns = useMemo<AdaptiveColumnDef<User>[]>(
		() => [
			{
				id: "rowNumber",
				header: "#",
				cell: ({ row }) => row.index + 1,
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
				enableHiding:true
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
					{ label: "Active", value: "true" },
					{ label: "Inactive", value: "false" },
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
		[navigate],
	);

	return (
		<div className="p-6 h-full flex flex-col overflow-hidden">
			<Card className="flex-1 p-6 flex flex-col overflow-hidden">
				<ServerDataTable
					columns={columns}
					endpoint={client.users.$get}
					queryKey={["users"]}
					title="Users"
					saveState="users-table"
					// Hide username by default as requested
					initialState={{
						columnVisibility: {
							username: false,
						},
					}}
					// Row detail navigation
					showDetail
					onDetailClick={(user: User) => {
						navigate({
							to: "/users/detail/$userId",
							params: { userId: user.id },
						});
					}}
					// Header action
					headerActions={
						<Link to="/users/create">
							<Button leftSection={<TbPlus />}>
								Create User
							</Button>
						</Link>
					}
					// Enable features
					columnOrderable
					columnResizable
					rowVirtualization
				/>
			</Card>

			<Outlet />
		</div>
	);
}
