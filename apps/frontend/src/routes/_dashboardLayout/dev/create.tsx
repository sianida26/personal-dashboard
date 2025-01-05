import ModalFormTemplate from "@/components/ModalFormTemplate";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import generateRandomPassword from "@/utils/generateRandomPassword";
import { useForm } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TbRefresh } from "react-icons/tb";

export const Route = createFileRoute("/_dashboardLayout/dev/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const form = useForm({
		initialValues: {
			id: "",
			email: "",
			name: "",
			username: "",
			photoProfileUrl: "",
			password: "",
			roles: [] as string[],
		},
	});

	const { data: roles } = useQuery({
		queryKey: ["roles"],
		queryFn: async () => fetchRPC(client.roles.$get()),
	});

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={() =>
				fetchRPC(
					client.users.$post({
						form: form.getValues(),
					})
				)
			}
			title="Create new User"
			onClose={() => navigate({ to: ".." })}
		>
			{createInputComponents({
				// disableAll: mutation.isPending,
				inputs: [
					{
						type: "text",
						readOnly: true,
						// variant: "filled",
						...form.getInputProps("id"),
						hidden: !form.values.id,
					},
					{
						type: "text",
						label: "Name",
						withAsterisk: true,
						...form.getInputProps("name"),
					},
					{
						type: "text",
						label: "Username",
						withAsterisk: true,
						...form.getInputProps("username"),
					},
					{
						type: "text",
						label: "Email",
						...form.getInputProps("email"),
					},
					{
						type: "custom",
						component: (
							<div className="flex flex-col">
								<PasswordInput
									label="Password"
									withAsterisk
									{...form.getInputProps("password")}
								/>
								<Button
									variant="ghost"
									className="border-primary"
									type="button"
									onClick={() => {
										form.setFieldValue(
											"password",
											generateRandomPassword()
										);
									}}
								>
									<TbRefresh />
									Generate Random Password
								</Button>
							</div>
						),
					},
					{
						type: "multi-select",
						label: "Roles",
						selectedOptions: form.values.roles,
						onChange: (values) => console.log(values),
						options:
							roles?.map((role) => ({
								value: role.id,
								label: role.name,
							})) ?? [],
						// error: form.errors.roles,
					},
				],
			})}
		</ModalFormTemplate>
	);
}
