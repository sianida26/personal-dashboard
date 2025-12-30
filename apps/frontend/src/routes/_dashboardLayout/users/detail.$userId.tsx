import { useNavigate, Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	buttonVariants,
	Badge,
	Card,
	Label,
} from "@repo/ui";
import PermissionMatrix from "@/modules/users/components/PermissionMatrix";
import { TbPencil, TbUser, TbShield, TbMail } from "react-icons/tb";

export const Route = createFileRoute("/_dashboardLayout/users/detail/$userId")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { userId: id } = Route.useParams();

	// 1. Fetch User Data
	const { data: userData } = useQuery({
		queryKey: ["users", { id }],
		queryFn: () =>
			fetchRPC(
				client.users[":id"].$get({
					param: { id },
					query: {},
				}),
			),
	});

	// 2. Fetch All Permissions (for Matrix)
	const { data: permissionsList } = useQuery({
		queryKey: ["permissions"],
		queryFn: async () => {
			const res = await fetchRPC(client.permissions.$get());
			return res;
		},
	});

	// 3. Fetch All Roles (for Matrix)
	const { data: rolesResponse } = useQuery({
		queryKey: ["roles"],
		queryFn: async () => {
			const res = await fetchRPC(
				client.roles.$get({
					query: {
						page: "1",
						limit: "100",
					},
				}),
			);
			return res;
		},
	});

	const permissionsData = permissionsList ?? [];

	// Map role permission codes to IDs for Matrix
	const allRolesData = (rolesResponse?.data ?? []).map((role) => {
		const rolePermissionIds = role.permissions
			.map((code) => permissionsData.find((p) => p.code === code)?.id)
			.filter((id): id is string => Boolean(id));

		return {
			...role,
			permissions: rolePermissionIds,
		};
	});

	// Helper to handle Sheet close
	const handleClose = () => navigate({ to: "/users" });

	return (
		<Sheet open={true} onOpenChange={(open) => !open && handleClose()}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-2xl sm:w-2xl flex flex-col h-full p-0 gap-0"
			>
				<SheetHeader className="p-6 border-b shrink-0">
					<div className="flex items-center justify-between">
						<div>
							<SheetTitle>User Details</SheetTitle>
							<SheetDescription>
								View detailed information, roles, and
								permissions.
							</SheetDescription>
						</div>
						<Link
							to="/users/edit/$userId"
							params={{ userId: id }}
							className={buttonVariants({ size: "sm" })}
						>
							<TbPencil className="mr-2 h-4 w-4" />
							Edit User
						</Link>
					</div>
				</SheetHeader>

				{(!userData || !rolesResponse || !permissionsList) ? (
					<div className="flex items-center justify-center p-8 text-muted-foreground">
						Loading user details...
					</div>
				) : (
					<div className="flex-1 overflow-y-auto p-6 space-y-8">
					{/* Section 1: User Identity */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
							<TbUser className="w-5 h-5" />
							<h3 className="font-semibold text-sm text-foreground">
								User Identity
							</h3>
						</div>

						{/* Read-only Fields Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									Full Name
								</Label>
								<div className="font-medium">
									{userData?.name || "-"}
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									Username
								</Label>
								<div className="font-medium">
									{userData?.username || "-"}
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									Email Address
								</Label>
								<div className="flex items-center gap-2">
									<TbMail className="text-muted-foreground w-4 h-4" />
									<span>{userData?.email || "-"}</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									Account Status
								</Label>
								<div>
									{userData?.isEnabled ? (
										<Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
											Active
										</Badge>
									) : (
										<Badge variant="destructive">
											Disabled
										</Badge>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Section 2: Roles & Permissions */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
							<TbShield className="w-5 h-5" />
							<h3 className="font-semibold text-sm text-foreground">
								Roles & Permissions
							</h3>
						</div>

						<div className="space-y-2">
							<Label className="text-muted-foreground text-xs">
								Assigned Roles
							</Label>
							<div className="flex flex-wrap gap-2">
								{userData?.roles &&
								userData.roles.length > 0 ? (
									userData.roles.map((role) => (
										<Badge
											key={role.id}
											variant="outline"
											className="pl-1 pr-2 py-1"
										>
											<div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
											{role.name}
										</Badge>
									))
								) : (
									<span className="text-sm text-muted-foreground italic">
										No roles assigned
									</span>
								)}
							</div>
						</div>

						<div className="pt-2">
							<Label className="text-muted-foreground text-xs mb-2 block">
								Effective Permissions
							</Label>
							<Card className="border rounded-md min-h-0 bg-gray-50/50">
								<PermissionMatrix
									permissions={permissionsData}
									roles={allRolesData}
									selectedRoleIds={
										userData?.roles?.map((r) => r.id) || []
									}
									selectedPermissionIds={
										userData?.permissions || []
									}
									onChange={() => {}} // Read-only
									disabled={true} // Read-only
									className="border-0 bg-transparent shadow-none"
								/>
							</Card>
						</div>
					</div>
				</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
