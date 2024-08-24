import stringToColorHex from "@/utils/stringToColorHex";
import {
	Avatar,
	Button,
	Center,
	Flex,
	Modal,
	MultiSelect,
	PasswordInput,
	ScrollArea,
	Stack,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useSearch } from "@tanstack/react-router";
import { createUser, updateUser } from "../queries/userQueries";
import { TbDeviceFloppy } from "react-icons/tb";
import client from "../../../honoClient";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";

const routeApi = getRouteApi("/_dashboardLayout/users/");

export default function UserFormModal() {
	const searchParams = useSearch({ from: "/_dashboardLayout/users/" }) as {
		detail: string;
		edit: string;
		create: boolean;
	};

	const queryClient = useQueryClient();

	const userId = searchParams.detail || searchParams.edit;

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

	const userQuery = useQuery({
		queryKey: ["users", userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) return null;
			const res = await client.users[":id"].$get({
				param: {
					id: userId,
				},
				query: {},
			});

			if (res.ok) {
				console.log("ok");
				return await res.json();
			}
			console.log("not ok");
			throw new Error(await res.text());
		},
	});

	const isModalOpen =
		Boolean(userId && userQuery.data) || searchParams.create;

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
		onError: (error) => {
			try {
				form.setErrors(JSON.parse(JSON.parse(error.message).message));
			} catch (e) {
				console.error(e);
			}
		},
	});

	const navigate = routeApi.useNavigate();

	const detailId = searchParams.detail;
	const editId = searchParams.edit;

	const formType = detailId ? "detail" : editId ? "edit" : "create";
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
		// validate: zodResolver(userFormDataSchema),
		// validateInputOnChange: false,
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
	}, [userQuery.data]);

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
		notifications.show({
			message: `The ser is ${formType === "create" ? "created" : "edited"}`,
		});

		navigate({ search: {} });
	};

	return (
		<Modal
			opened={isModalOpen}
			onClose={() => navigate({ search: {} })}
			title={modalTitle} //Uppercase first letter
			scrollAreaComponent={ScrollArea.Autosize}
			size="md"
		>
			<form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
				<Stack mt="sm" gap="lg" px="lg">
					{/* Avatar */}
					<Center>
						<Avatar
							color={stringToColorHex(form.values.id ?? "")}
							src={form.values.photoProfileUrl}
							size={120}
						>
							{form.values.name?.[0]?.toUpperCase()}
						</Avatar>
					</Center>
				</Stack>

				{form.values.id && (
					<TextInput
						label="ID"
						readOnly
						variant="filled"
						disabled={mutation.isPending}
						{...form.getInputProps("id")}
					/>
				)}

				<TextInput
					data-autofocus
					label="Name"
					readOnly={formType === "detail"}
					disabled={mutation.isPending}
					{...form.getInputProps("name")}
				/>

				<TextInput
					label="Username"
					readOnly={formType === "detail"}
					disabled={mutation.isPending}
					{...form.getInputProps("username")}
				/>

				<TextInput
					label="Email"
					readOnly={formType === "detail"}
					disabled={mutation.isPending}
					{...form.getInputProps("email")}
				/>

				{formType === "create" && (
					<PasswordInput
						label="Password"
						disabled={mutation.isPending}
						{...form.getInputProps("password")}
					/>
				)}

				{/* Role */}
				<MultiSelect
					label="Roles"
					readOnly={formType === "detail"}
					disabled={mutation.isPending}
					value={form.values.roles}
					onChange={(values) => form.setFieldValue("roles", values)}
					data={rolesQuery.data?.map((role) => ({
						value: role.id,
						label: role.name,
					}))}
					error={form.errors.roles}
				/>

				{/* Buttons */}
				<Flex justify="flex-end" align="center" gap="lg" mt="lg">
					<Button
						variant="outline"
						onClick={() => navigate({ search: {} })}
						disabled={mutation.isPending}
					>
						Close
					</Button>
					{formType !== "detail" && (
						<Button
							variant="filled"
							leftSection={<TbDeviceFloppy size={20} />}
							type="submit"
							loading={mutation.isPending}
						>
							Save
						</Button>
					)}
				</Flex>
			</form>
		</Modal>
	);
}
