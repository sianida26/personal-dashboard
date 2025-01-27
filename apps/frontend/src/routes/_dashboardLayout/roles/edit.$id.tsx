import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import { useForm } from "@mantine/form";
import { type PermissionCode, permissions } from "@repo/data";
import type { roleFormSchema } from "@repo/validation";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react"; // Add this import
import type { z } from "zod";

export const Route = createFileRoute("/_dashboardLayout/roles/edit/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = Route.useParams();
	const navigate = Route.useNavigate();

	const isMutating = useIsMutating({
		mutationKey: ["update-role", id],
	});

	const form = useForm<z.infer<typeof roleFormSchema>>({
		initialValues: {
			description: "",
			name: "",
			permissions: [],
		},
	});

	const roleQuery = useQuery({
		queryKey: ["roles", { id }],
		queryFn: () => fetchRPC(client.roles[":id"].$get({ param: { id } })),
	});

	// Populate form when query data is available
	useEffect(() => {
		if (roleQuery.data) {
			form.setValues({
				name: roleQuery.data.name,
				description: roleQuery.data.description ?? "",
				permissions: roleQuery.data.permissions ?? [],
			});
		}
	}, [roleQuery.data]);

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={() =>
				fetchRPC(
					client.roles[":id"].$patch({
						param: { id },
						json: {
							name: form.values.name,
							description: form.values.description,
							permissions: form.values.permissions,
						},
					}),
				)
			}
			title="Edit Role"
			onClose={() => navigate({ to: "/roles" })}
			onSuccess={() => navigate({ to: "/roles" })}
			successToastMessage="Role has been updated successfully"
			mutationKey={["update-role", id]}
			invalidateQueries={["roles"]}
		>
			{createInputComponents({
				disableAll: Boolean(isMutating) || roleQuery.isLoading,
				inputs: [
					{
						type: "text",
						label: "Name",
						withAsterisk: true,
						...form.getInputProps("name"),
					},
					{
						...form.getInputProps("description"),
						type: "textarea",
						label: "Description",
						withAsterisk: true,
					},
					{
						type: "multi-select",
						label: "Permissions",
						selectedOptions: form.values.permissions ?? [],
						onChange: (values) =>
							form.setFieldValue(
								"permissions",
								values as PermissionCode[],
							),
						options: Array.from(permissions),
						error: form.errors.roles,
					},
				],
			})}
		</ModalFormTemplate>
	);
}
