import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbDeviceFloppy, TbRefresh } from "react-icons/tb";
import client from "../../../honoClient";
import { useEffect } from "react";
import FormResponseError from "@/errors/FormResponseError";
import createInputComponents from "@/utils/createInputComponents";
import { useNavigate } from "@tanstack/react-router";
import {
	createUser,
	getUserByIdQueryOptions,
	updateUser,
} from "@/modules/usersManagement/queries/userQueries";
import { useToast } from "@/hooks/use-toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import generateRandomPassword from "@/utils/generateRandomPassword";

type Props = {
	formType: "edit" | "create" | "detail";
	userId?: string;
};

export default function UserFormModal({ formType, userId }: Props) {
	/**
	 * DON'T CHANGE FOLLOWING:
	 */
	const queryClient = useQueryClient();

	const navigate = useNavigate();

	const { toast } = useToast();

	/**
	 * CHANGE FOLLOWING:
	 */

	const userQuery = useQuery(getUserByIdQueryOptions(userId));

	const modalTitle =
		formType.charAt(0).toUpperCase() + formType.slice(1) + " User";

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

	useEffect(() => {
		const data = userQuery.data;

		if (!data) {
			form.reset();
			return;
		}

		form.setValues({
			id: data.id,
			email: data.email ?? "",
			name: data.name,
			photoProfileUrl: "",
			username: data.username,
			password: "",
			roles: data.roles.map((v) => v.id), //only extract the id
		});

		form.setErrors({});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userQuery.data]);

	const mutation = useMutation({
		mutationKey: ["usersMutation"],
		mutationFn: async (
			options:
				| { action: "edit"; data: Parameters<typeof updateUser>[0] }
				| { action: "create"; data: Parameters<typeof createUser>[0] }
		) => {
			console.log("called");
			return options.action === "edit"
				? await updateUser(options.data)
				: await createUser(options.data);
		},
		onError: (error: unknown) => {
			console.log(error);

			if (error instanceof FormResponseError) {
				form.setErrors(error.formErrors);
				return;
			}

			if (error instanceof Error) {
				toast({
					description: error.message,
					variant: "destructive",
				});
			}
		},
	});

	const handleSubmit = async (values: typeof form.values) => {
		if (formType === "detail") return;

		//TODO: OPtimize this code
		if (formType === "create") {
			await mutation.mutateAsync({
				action: formType,
				data: {
					email: values.email,
					name: values.name,
					password: values.password,
					roles: JSON.stringify(values.roles),
					isEnabled: "true",
					username: values.username,
				},
			});
		} else {
			await mutation.mutateAsync({
				action: formType,
				data: {
					id: values.id,
					email: values.email,
					name: values.name,
					password: values.password,
					roles: JSON.stringify(values.roles),
					isEnabled: "true",
					username: values.username,
				},
			});
		}
		queryClient.invalidateQueries({ queryKey: ["users"] });
		toast({
			description: `The user is ${formType === "create" ? "created" : "edited"}`,
			className: "bg-green-200 text-green-800",
		});

		navigate({ to: "/users" });
	};

	const closeModal = () => {
		navigate({ to: "/users" });
		form.reset();
	};

	/**
	 * YOU MIGHT NOT NEED FOLLOWING:
	 */
	const rolesQuery = useQuery({
		queryKey: ["roles"],
		queryFn: async () => {
			const res = await client.roles.$get();

			if (res.ok) {
				return await res.json();
			}

			throw new Error(await res.text());
		},
	});

	return (
		<Dialog open={true}>
			<DialogContent onClose={closeModal}>
				<DialogHeader>
					<DialogTitle>{modalTitle}</DialogTitle>
				</DialogHeader>

				<form onSubmit={form.onSubmit(handleSubmit)}>
					{createInputComponents({
						disableAll: mutation.isPending,
						readonlyAll: formType === "detail",
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
								hidden: formType !== "create",
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
								onChange: (values) =>
									form.setFieldValue("roles", values),
								options:
									rolesQuery.data?.map((role) => ({
										value: role.id,
										label: role.name,
									})) ?? [],
								// error: form.errors.roles,
							},
						],
					})}

					{/* Buttons */}
					<div className="flex justify-end items-center gap-4 mt-4">
						<Button
							variant="outline"
							type="button"
							onClick={closeModal}
							disabled={mutation.isPending}
						>
							Close
						</Button>
						{formType !== "detail" && (
							<Button
								leftSection={<TbDeviceFloppy size={20} />}
								type="submit"
								// loading={mutation.isPending}
							>
								Save
							</Button>
						)}
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
