import client from "@/honoClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import fetchRPC from "@/utils/fetchRPC";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/_dashboardLayout/users/delete/$userId")({
	component: UserDeleteModal,
});

export default function UserDeleteModal() {
	const { toast } = useToast();

	const params = Route.useParams();

	const queryClient = useQueryClient();

	const userId = params.userId;
	const navigate = Route.useNavigate();

	const userQuery = useQuery({
		queryKey: ["users", userId],
		queryFn: async () => {
			if (!userId) return null;
			return await fetchRPC(
				client.users[":id"].$get({
					param: {
						id: userId,
					},
					query: {},
				})
			);
		},
	});

	const mutation = useMutation({
		mutationKey: ["deleteUserMutation"],
		mutationFn: async ({ id }: { id: string }) => {
			return await fetchRPC(
				client.users[":id"].$delete({
					param: {
						id,
					},
					form: {},
				})
			);
		},
		onError: (error: unknown) => {
			if (error instanceof Error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: error.message,
				});
			}
		},
		onSuccess: () => {
			toast({
				description: "User deleted successfully.",
				className: "bg-green-300 text-green-800",
			});
			queryClient.removeQueries({ queryKey: ["user", userId] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			handleCloseModal();
		},
	});

	const handleCloseModal = () => {
		if (mutation.isPending) return;
		navigate({ to: "/users" });
	};

	const isModalOpen = Boolean(userId && userQuery.data);

	return (
		<AlertDialog open={isModalOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you absolutely sure?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently
						delete the data of user{" "}
						<b className="text-foreground">
							{userQuery.data?.name}
						</b>
						.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-4">
					<Button
						disabled={mutation.isPending}
						variant="ghost"
						onClick={handleCloseModal}
					>
						Cancel
					</Button>
					<Button
						onClick={() => mutation.mutate({ id: userId })}
						disabled={mutation.isPending}
						variant="destructive"
					>
						Yes, I am sure
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
