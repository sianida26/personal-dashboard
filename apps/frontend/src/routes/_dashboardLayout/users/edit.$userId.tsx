import ModalFormTemplate from "@/components/ModalFormTemplate";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import client from "@/honoClient";
import createInputComponents from "@/utils/createInputComponents";
import fetchRPC from "@/utils/fetchRPC";
import generateRandomPassword from "@/utils/generateRandomPassword";
import { useForm } from "@mantine/form";
import type { userUpdateSchema } from "@repo/validation";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TbRefresh } from "react-icons/tb";
import type { z } from "zod";

export const Route = createFileRoute("/_dashboardLayout/users/edit/$userId")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const isMutating = useIsMutating({
		mutationKey: ["edit-user"],
	});
	const { userId: id } = Route.useParams();

	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const detailEndpoint = client.users[":id"].$get;

	const { data: userData } = useQuery({
		queryKey: ["users", { id }],
		queryFn: () => fetchRPC(detailEndpoint({ param: { id }, query: {} })),
	});

	useEffect(() => {
		userData &&
			form.setValues({
				email: userData.email ?? "",
				isEnabled: userData.isEnabled ?? false,
				name: userData.name,
				roles: userData.roles.map((role) => role.id),
				username: userData.username,
			});
	}, [userData]);

	const form = useForm<z.infer<typeof userUpdateSchema>>({
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
					client.users[":id"].$patch({
						param: { id },
						json: {
							name: form.values.name,
							password: form.values.password,
							username: form.values.username,
							email: form.values.email,
							isEnabled: form.values.isEnabled,
							roles: form.values.roles,
						},
					}),
				)
			}
			title="Edit User"
			onClose={() => navigate({ to: "/users" })}
			onSuccess={() => navigate({ to: "/users" })}
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
						onChange: (values) =>
							form.setFieldValue("roles", values),
						options:
							roles?.data?.map((role) => ({
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
