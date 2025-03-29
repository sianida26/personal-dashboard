import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
} from "@repo/ui";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import { permissions, type PermissionCode } from "@repo/data";
import type { roleFormSchema } from "@repo/validation";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import type { z } from "zod";

export const Route = createFileRoute("/_dashboardLayout/roles/edit/$roleId")({
	component: RouteComponent,
	staticData: {
		title: "Edit Role",
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const isMutating = useIsMutating({
		mutationKey: ["edit-role"],
	});
	const { roleId: id } = Route.useParams();

	const detailEndpoint = client.roles[":id"].$get;

	const { data: roleData } = useQuery({
		queryKey: ["roles", { id }],
		queryFn: () => fetchRPC(detailEndpoint({ param: { id } })),
	});

	useEffect(() => {
		roleData &&
			form.setValues({
				name: roleData.name,
				description: roleData.description ?? "",
				permissions: roleData.permissions,
			});
	}, [roleData]);

	const form = useForm<z.infer<typeof roleFormSchema>>({
		initialValues: {
			name: "",
			description: "",
			permissions: [] as PermissionCode[],
		},
	});

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

	const handlePermissionChange = (
		permission: PermissionCode,
		checked: boolean,
	) => {
		const currentPermissions = form.values.permissions ?? [];
		if (checked) {
			form.setFieldValue("permissions", [
				...currentPermissions,
				permission,
			]);
		} else {
			form.setFieldValue(
				"permissions",
				currentPermissions.filter((p) => p !== permission),
			);
		}
	};

	const handleSubmit = async () => {
		try {
			await fetchRPC(
				client.roles[":id"].$patch({
					param: { id },
					json: {
						name: form.values.name,
						description: form.values.description,
						permissions: form.values.permissions,
					},
				}),
			);
			navigate({ to: "/roles" });
		} catch (error) {
			console.error(error);
		}
	};

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
									label: "Description",
									...form.getInputProps("description"),
								},
							],
						})}
						<div className="space-y-4" id="permissions-section">
							<label
								htmlFor="permissions-section"
								className="text-sm font-medium"
							>
								Permissions
							</label>
							<div className="space-y-4">
								{Object.entries(groupedPermissions).map(
									([group, groupPermissions]) => (
										<div key={group} className="space-y-2">
											<h3 className="text-sm font-medium capitalize">
												{group}
											</h3>
											<div className="grid grid-cols-1 gap-2">
												{groupPermissions.map(
													(permission) => (
														<Checkbox
															key={permission}
															label={
																permission.split(
																	".",
																)[1]
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
	);
}
