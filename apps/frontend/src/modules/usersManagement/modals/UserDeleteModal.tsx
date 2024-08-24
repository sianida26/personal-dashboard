import client from "@/honoClient";
import { Button, Flex, Modal, Text } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useSearch } from "@tanstack/react-router";
import { deleteUser } from "../queries/userQueries";
import { notifications } from "@mantine/notifications";

const routeApi = getRouteApi("/_dashboardLayout/users/");

export default function UserDeleteModal() {
	const queryClient = useQueryClient();

	const searchParams = useSearch({ from: "/_dashboardLayout/users/" }) as {
		delete: string;
	};

	const userId = searchParams.delete;
	const navigate = routeApi.useNavigate();

	const userQuery = useQuery({
		queryKey: ["users", userId],
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

	const mutation = useMutation({
		mutationKey: ["deleteUserMutation"],
		mutationFn: async ({ id }: { id: string }) => {
			return await deleteUser(id);
		},
		onError: (error) => {
			try {
				const message = JSON.parse(error.message);
				notifications.show({
					message: message.message ?? "Failed to delete User.",
					color: "red",
				});
			} catch (e) {
				console.log(error);
			}
		},
		onSuccess: () => {
			notifications.show({
				message: "User deleted successfully.",
				color: "green",
			});
			queryClient.removeQueries({ queryKey: ["user", userId] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			navigate({ search: {} });
		},
	});

	const isModalOpen = Boolean(searchParams.delete && userQuery.data);

	return (
		<Modal
			opened={isModalOpen}
			onClose={() => navigate({ search: {} })}
			title={`Delete confirmation`}
		>
			<Text size="sm">
				Are you sure you want to delete user{" "}
				<Text span fw={700}>
					{userQuery.data?.name}
				</Text>
				? This action is irreversible.
			</Text>

			{/* {errorMessage && <Alert color="red">{errorMessage}</Alert>} */}
			{/* Buttons */}
			<Flex justify="flex-end" align="center" gap="lg" mt="lg">
				<Button
					variant="outline"
					onClick={() => navigate({ search: {} })}
					disabled={mutation.isPending}
				>
					Cancel
				</Button>
				<Button
					variant="subtle"
					// leftSection={<TbDeviceFloppy size={20} />}
					type="submit"
					color="red"
					loading={mutation.isPending}
					onClick={() => mutation.mutate({ id: userId })}
				>
					Delete User
				</Button>
			</Flex>
		</Modal>
	);
}
