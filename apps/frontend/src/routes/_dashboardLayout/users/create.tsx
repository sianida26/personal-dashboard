import { useForm } from "@mantine/form";
import { Button, PasswordInput } from "@repo/ui";
import type { userFormSchema } from "@repo/validation";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TbRefresh } from "react-icons/tb";
import type { z } from "zod";
import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import generateRandomPassword from "@/utils/generateRandomPassword";

export const Route = createFileRoute()({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const isMutating = useIsMutating({
		mutationKey: ["create-user"],
	});

	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const form = useForm<z.infer<typeof userFormSchema>>({
		initialValues: {
			email: "",
			name: "",
			username: "",
			password: "",
			isEnabled: true,
			roles: [] as string[],
		},
	});

	const { data: roles } = useQuery({
		queryKey: ["roles"],
		queryFn: () =>
			fetchRPC(
				client.roles.$get({
					query: {
						page: "1",
						limit: "1000",
					},
				}),
			),
	});

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={() =>
				fetchRPC(
					client.users.$post({
						json: {
							name: form.values.name,
							password: form.values.password,
							username: form.values.username,
							roles: form.values.roles,
						},
					}),
				)
			}
			title="Create new User"
			onClose={() => navigate({ to: ".." })}
			onSuccess={() => navigate({ to: ".." })}
			successToastMessage="User have been created successfully"
			mutationKey={["create-user"]}
			invalidateQueries={["users"]}
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
						type: "checkbox",
						label: "Enabled",
						...form.getInputProps("isEnabled", {
							type: "checkbox",
						}),
					},
					{
						type: "custom",
						component: (
							<div className="flex flex-col">
								<PasswordInput
									label="Password"
									withAsterisk
									isPasswordVisible={isPasswordVisible}
									onPasswordVisibilityChange={
										setIsPasswordVisible
									}
									{...form.getInputProps("password")}
								/>
								<Button
									variant="ghost"
									className="border-primary"
									type="button"
									onClick={() => {
										form.setFieldValue(
											"password",
											generateRandomPassword(),
										);
										setIsPasswordVisible(true);
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
						selectedOptions: form.values.roles ?? [],
						onChange: (values: string[]) =>
							form.setFieldValue("roles", values),
						options:
							roles?.data.map((role) => ({
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
