import { useForm } from "@mantine/form";
import { type PermissionCode, permissions } from "@repo/data";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
} from "@repo/ui";
import type { roleFormSchema } from "@repo/validation";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TbSearch } from "react-icons/tb";
import type { z } from "zod";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout/roles/edit/$roleId")({
	component: RouteComponent,
	staticData: {
		title: "Edit Role",
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const [permissionSearch, setPermissionSearch] = useState("");
	const isMutating = useIsMutating({
		mutationKey: ["edit-role"],
	})
	const { roleId: id } = Route.useParams();

	const detailEndpoint = client.roles[":id"].$get;

	const { data: roleData } = useQuery({
		queryKey: ["roles", { id }],
		queryFn: () => fetchRPC(detailEndpoint({ param: { id } })),
	})

	useEffect(() => {
		roleData &&
			form.setValues({
				name: roleData.name,
				code: roleData.code ?? "",
				description: roleData.description ?? "",
				permissions: roleData.permissions,
			})
	}, [roleData]);

	const form = useForm<z.infer<typeof roleFormSchema>>({
		initialValues: {
			name: "",
			code: "",
			description: "",
			permissions: [] as PermissionCode[],
		},
	})

	const filteredPermissions = permissions.filter((permission) =>
		permission.toLowerCase().includes(permissionSearch.toLowerCase()),
	)

	const groupedPermissions = filteredPermissions.reduce(
		(acc, permission) => {
			const [group] = permission.split(".");
			if (!acc[group]) {
				acc[group] = [];
			}
			acc[group].push(permission);
			return acc;
		},
		{} as Record<string, PermissionCode[]>,
	)

	const handlePermissionChange = (
		permission: PermissionCode,
		checked: boolean,
	) => {
		const currentPermissions = form.values.permissions ?? [];
		if (checked) {
			form.setFieldValue("permissions", [
				...currentPermissions,
				permission,
			])
		} else {
			form.setFieldValue(
				"permissions",
				currentPermissions.filter((p) => p !== permission),
			)
		}
	}

	const handleSubmit = async () => {
		try {
			await fetchRPC(
				client.roles[":id"].$patch({
					param: { id },
					json: {
						name: form.values.name,
						code: form.values.code,
						description: form.values.description,
						permissions: form.values.permissions,
					},
				}),
			)
			navigate({ to: "/roles" });
		} catch (error) {
			console.error(error);
		}
	}

	return (
        <div className="container mx-auto py-6">
            <Card>
				<CardHeader>
					<CardTitle>Edit Role</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.onSubmit(handleSubmit)}
						className="space-y-4"
					>
						{createInputComponents({
							disableAll: Boolean(isMutating),
							inputs: [
								{
									type: "text",
									label: "Name",
									withAsterisk: true,
									...form.getInputProps("name"),
								},
								{
									type: "text",
									label: "Code",
									...form.getInputProps("code"),
								},
								{
									type: "text",
									label: "Description",
									...form.getInputProps("description"),
								},
							],
						})}
						<div className="space-y-4" id="permissions-section">
							<div className="flex items-center justify-between">
								<label
									htmlFor="permissions-section"
									className="text-sm font-medium"
								>
									Permissions
								</label>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											const allPermissions = [
												...permissions,
											]
											form.setFieldValue(
												"permissions",
												allPermissions,
											)
										}}
										disabled={Boolean(isMutating)}
									>
										Select All
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											form.setFieldValue(
												"permissions",
												[],
											)
										}}
										disabled={Boolean(isMutating)}
									>
										Clear All
									</Button>
								</div>
							</div>
							<div className="flex gap-2 mb-4">
								<Input
									placeholder="Search permissions..."
									value={permissionSearch}
									onChange={(e) =>
										setPermissionSearch(e.target.value)
									}
									className="flex-1"
									leftSection={<TbSearch size={16} />}
								/>
							</div>
							<div className="space-y-6">
								{Object.entries(groupedPermissions).map(
									([group, groupPermissions]) => (
										<div
											key={group}
											className="border rounded-lg p-4 space-y-3"
										>
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-semibold capitalize flex items-center gap-2">
													{group.replace("-", " ")}
													<Badge
														variant="outline"
														className="text-xs"
													>
														{
															groupPermissions.length
														}
													</Badge>
												</h3>
												<div className="flex gap-1">
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => {
															const currentPerms =
																form.values
																	.permissions ??
																[]
															const hasAllGroupPerms =
																groupPermissions.every(
																	(p) =>
																		currentPerms.includes(
																			p,
																		),
																)

															if (
																hasAllGroupPerms
															) {
																// Remove all group permissions
																form.setFieldValue(
																	"permissions",
																	currentPerms.filter(
																		(p) =>
																			!groupPermissions.includes(
																				p,
																			),
																	),
																)
															} else {
																// Add all group permissions
																const newPerms =
																	[
																		...new Set(
																			[
																				...currentPerms,
																				...groupPermissions,
																			],
																		),
																	]
																form.setFieldValue(
																	"permissions",
																	newPerms,
																)
															}
														}}
														disabled={Boolean(
															isMutating,
														)}
														className="text-xs h-6 px-2"
													>
														{groupPermissions.every(
															(p) =>
																form.values.permissions?.includes(
																	p,
																),
														)
															? "Unselect"
															: "Select"}{" "}
														All
													</Button>
												</div>
											</div>
											<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
												{groupPermissions.map(
													(permission) => (
														<Checkbox
															key={permission}
															label={
																permission
																	.split(
																		".",
																	)[1]
																	?.replace(
																		/([A-Z])/g,
																		" $1",
																	)
																	.trim() ||
																permission
															}
															checked={form.values.permissions?.includes(
																permission,
															)}
															onChange={(e) =>
																handlePermissionChange(
																	permission,
																	e as boolean,
																)
															}
															disabled={Boolean(
																isMutating,
															)}
															className="text-sm"
														/>
													),
												)}
											</div>
										</div>
									),
								)}
							</div>
							{form.errors.permissions && (
								<p className="text-sm text-red-500">
									{form.errors.permissions}
								</p>
							)}
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/roles" })}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={Boolean(isMutating)}
							>
								Save Changes
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
        </div>
    )
}
