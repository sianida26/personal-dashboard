import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import { useForm } from "@mantine/form";
import { type PermissionCode, permissions } from "@repo/data";
import type { roleFormSchema } from "@repo/validation";
import { useIsMutating } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { z } from "zod";

export const Route = createFileRoute("/_dashboardLayout/roles/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const isMutating = useIsMutating({
		mutationKey: ["create-role"],
	});

	const form = useForm<z.infer<typeof roleFormSchema>>({
		initialValues: {
			description: "",
			name: "",
			permissions: [],
		},
	});

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={() =>
				fetchRPC(
					client.roles.$post({
						json: {
							name: form.values.name,
							description: form.values.description,
							permissions: form.values.permissions,
						},
					}),
				)
			}
			title="Create New Role"
			onClose={() => navigate({ to: ".." })}
			onSuccess={() => navigate({ to: ".." })}
			successToastMessage="Role have been created successfully"
			mutationKey={["create-role"]}
			invalidateQueries={["roles"]}
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
