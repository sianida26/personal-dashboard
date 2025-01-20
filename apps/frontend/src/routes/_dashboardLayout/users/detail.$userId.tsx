import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import { useForm } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { InferResponseType } from "hono";
import { useEffect } from "react";

export const Route = createFileRoute("/_dashboardLayout/users/detail/$userId")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const { userId: id } = Route.useParams();

	const { data: roles } = useQuery({
		queryKey: ["roles"],
		queryFn: () => fetchRPC(client.roles.$get()),
	});

	const detailEndpoint = client.users[":id"].$get;

	const { data: userData } = useQuery({
		queryKey: ["users", { id }],
		queryFn: () => fetchRPC(detailEndpoint({ param: { id }, query: {} })),
	});

	const form = useForm<Partial<InferResponseType<typeof detailEndpoint>>>({
		initialValues: {
			email: "",
			id: "",
			isEnabled: false,
			name: "",
			roles: [],
			username: "",
		},
	});

	useEffect(() => {
		userData && form.setValues(userData);
	}, [userData]);

	return (
		<ModalFormTemplate
			form={form}
			title={"User Detail"}
			onClose={() => navigate({ to: "/users" })}
			buttons={{
				submit: false,
			}}
		>
			{createInputComponents({
				readonlyAll: true,
				inputs: [
					{
						type: "text",
						label: "ID",
						...form.getInputProps("id"),
					},
					{
						type: "text",
						label: "Name",
						...form.getInputProps("name"),
					},
					{
						type: "text",
						label: "Username",
						...form.getInputProps("username"),
					},
					{
						type: "text",
						label: "Email",
						...form.getInputProps("email"),
					},
					{
						type: "checkbox",
						label: "Enabled",
						...form.getInputProps("isEnabled", {
							type: "checkbox",
						}),
					},
					{
						type: "multi-select",
						label: "Roles",
						selectedOptions:
							form.values.roles?.map((x) => x.id) ?? [],
						options:
							roles?.map((role) => ({
								value: role.id,
								label: role.name,
							})) ?? [],
						error: form.errors.roles,
					},
				],
			})}
		</ModalFormTemplate>
	);
}
