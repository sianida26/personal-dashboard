import ModalFormTemplate from "@/components/ModalFormTemplate";
import PermissionMatrix from "@/modules/users/components/PermissionMatrix";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";
import generateRandomPassword from "@/utils/generateRandomPassword";
import { useForm } from "@mantine/form";
import { userFormSchema } from "@repo/validation";
import { zodResolver } from "mantine-form-zod-resolver";
import { 
	Button, 
	Card, 
	Checkbox, 
	Input, 
	Label, 
	MultiSelect 
} from "@repo/ui";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TbLock, TbRefresh, TbShield, TbUser } from "react-icons/tb";
import { toast } from "sonner";
import type { z } from "zod";

export const Route = createFileRoute("/_dashboardLayout/users/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const isMutating = useIsMutating({ mutationKey: ["create-user"] });
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const form = useForm<z.infer<typeof userFormSchema>>({
		// @ts-ignore - resolver types might be incompatible but works in runtime
		validate: zodResolver(userFormSchema),
		initialValues: {
			email: "",
			name: "",
			username: "",
			password: "",
			isEnabled: true,
			roles: [],
			permissions: [],
		},
	});

	// Fetch permissions
	const { data: permissionsList } = useQuery({
		queryKey: ["permissions"],
		queryFn: async () => {
			const res = await fetchRPC(client.permissions.$get());
			return res;
		},
	});

	// Fetch roles
	const { data: rolesResponse } = useQuery({
		queryKey: ["roles"],
		queryFn: async () => {
			const res = await fetchRPC(
				client.roles.$get({
					query: {
						page: "1",
						limit: "100", // Fetch enough for dropdown
					},
				}),
			);
			return res;
		},
	});

	const permissionsData = permissionsList ?? [];

	// Map role permission codes to IDs
	const rolesData = (rolesResponse?.data ?? []).map((role) => {
		const rolePermissionIds = role.permissions
			.map((code) => permissionsData.find((p) => p.code === code)?.id)
			.filter((id): id is string => Boolean(id));
		
		return {
			...role,
			permissions: rolePermissionIds,
		};
	});

	const roleOptions = rolesData.map((role) => ({
		value: role.id,
		label: role.name,
	}));

	const { checkPermission } = useAuth();
	const canAssignPermissions = checkPermission("users.assignPermissions");

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={async () => {
				try {
					await fetchRPC(
						client.users.$post({
							json: { ...form.values },
						}),
					);
					toast.success("User created successfully", {
						description:
							"The new user has been added to the system.",
					});
				} catch (error: any) {
					toast.error("Failed to create user", {
						description:
							error.message || "An unexpected error occurred.",
					});
					throw error;
				}
			}}
			title="Create New User"
			onClose={() => navigate({ to: ".." })}
			onSuccess={() => navigate({ to: ".." })}
			mutationKey={["create-user"]}
			invalidateQueries={["users"]}
			className="max-w-7xl h-[95vh]"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[90%] p-2">
				{/* --- KOLOM KIRI (STATIC) --- */}
				<div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
					<Card className="p-4 border rounded-md">
						<div className="flex items-center gap-2 mb-4 text-muted-foreground">
							<TbUser />
							<span className="font-semibold text-sm">
								User Identity
							</span>
						</div>
						<div className="flex flex-col gap-3">
							<div className="grid gap-2">
								<Label withAsterisk>Full Name</Label>
								<Input
									placeholder="Enter full name"
									{...form.getInputProps("name")}
								/>
								{form.errors.name && (
									<p className="text-destructive text-sm">
										{form.errors.name as string}
									</p>
								)}
							</div>
							<div className="grid gap-2">
								<Label withAsterisk>Username</Label>
								<Input
									placeholder="Enter username"
									{...form.getInputProps("username")}
								/>
								{form.errors.username && (
									<p className="text-destructive text-sm">
										{form.errors.username as string}
									</p>
								)}
							</div>
							<div className="grid gap-2">
								<Label>Email Address</Label>
								<Input
									placeholder="email@example.com"
									{...form.getInputProps("email")}
								/>
								{form.errors.email && (
									<p className="text-destructive text-sm">
										{form.errors.email as string}
									</p>
								)}
							</div>
							<Checkbox
								label="Account Enabled"
								checked={form.values.isEnabled}
								onChange={(e: any) =>
									form.setFieldValue("isEnabled", e as boolean)
								}
							/>
						</div>
					</Card>

					<Card className="p-4 border rounded-md bg-gray-50/50">
						<div className="flex items-center gap-2 mb-4 text-muted-foreground">
							<TbLock />
							<span className="font-semibold text-sm">
								Security
							</span>
						</div>
						<div className="flex flex-col gap-3">
							<div className="grid gap-2">
								<Label withAsterisk>Password</Label>
								<div className="relative">
									<Input
										type={
											isPasswordVisible
												? "text"
												: "password"
										}
										placeholder="Password"
										{...form.getInputProps("password")}
									/>
									<button
										type="button"
										className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
										onClick={() =>
											setIsPasswordVisible(
												!isPasswordVisible,
											)
										}
									>
										{isPasswordVisible
											? "Hide"
											: "Show"}
									</button>
								</div>
								{form.errors.password && (
									<p className="text-destructive text-sm">
										{form.errors.password as string}
									</p>
								)}
							</div>
							<Button
								type="button"
								variant="outline"
								className="w-full text-muted-foreground"
								onClick={() => {
									form.setFieldValue(
										"password",
										generateRandomPassword(),
									);
									setIsPasswordVisible(true);
								}}
							>
								<TbRefresh className="mr-2" />
								Generate Random Password
							</Button>
						</div>
					</Card>
				</div>

				{/* --- KOLOM KANAN: Access Control (Matrix) --- */}
				<Card className="h-full flex flex-col p-4 border rounded-md min-h-0">
					<div className="shrink-0 mb-4">
						<div className="flex items-center gap-2 mb-2 text-muted-foreground">
							<TbShield />
							<span className="font-semibold text-sm">
								Access Control
							</span>
						</div>
						<div className="mb-2">
							<MultiSelect
								label="Assign Roles"
								placeholder="Select roles..."
								options={roleOptions}
								selectedOptions={form.values.roles || []}
								onChange={(val) => form.setFieldValue("roles", val)}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Detailed permissions below. Check boxes
							to grant extra access.
						</p>
					</div>

					<div className="flex-1 pr-2 border-t pt-4 -mr-2 h-full overflow-hidden">
						<PermissionMatrix
							permissions={permissionsData}
							roles={rolesData}
							selectedRoleIds={form.values.roles || []}
							selectedPermissionIds={
								form.values.permissions || []
							}
							onChange={(ids) =>
								form.setFieldValue("permissions", ids)
							}
							assignPermissions={canAssignPermissions}
							disabled={
								Boolean(isMutating) ||
								!canAssignPermissions
							}
							className="border-0 bg-transparent shadow-none"
						/>
					</div>
				</Card>
			</div>
		</ModalFormTemplate>
	);
}
