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

export const Route = createFileRoute("/_dashboardLayout/roles/delete/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { toast } = useToast();

	const { id } = Route.useParams();

	const queryClient = useQueryClient();

	const navigate = Route.useNavigate();

	const roleQuery = useQuery({
		queryKey: ["roles", id],
		queryFn: async () => {
			if (!id) return null;
			return await fetchRPC(
				client.roles[":id"].$get({
					param: {
						id,
					},
				})
			);
		},
	});

	const mutation = useMutation({
		mutationKey: ["deleteRoleMutation"],
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
				description: "Role deleted successfully.",
				className: "bg-green-300 text-green-800",
			});
			queryClient.removeQueries({ queryKey: ["role", id] });
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			handleCloseModal();
		},
	});

	const handleCloseModal = () => {
		if (mutation.isPending) return;
		navigate({ to: "/roles" });
	};

	const isModalOpen = Boolean(id && roleQuery.data);

	return (
		<AlertDialog open={isModalOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you absolutely sure?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently
						delete the data of role{" "}
						<b className="text-foreground">
							{roleQuery.data?.name}
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
						onClick={() => mutation.mutate({ id })}
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
