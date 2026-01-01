import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
} from "@repo/ui";
import { useToast } from "@repo/ui/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute(
	"/_dashboardLayout/transactions/delete/$transactionId",
)({
	component: TransactionDeleteModal,
});

export default function TransactionDeleteModal() {
	const { toast } = useToast();
	const params = Route.useParams();
	const queryClient = useQueryClient();
	const transactionId = params.transactionId;
	const navigate = Route.useNavigate();

	const transactionQuery = useQuery({
		queryKey: ["transaction", transactionId],
		queryFn: async () => {
			if (!transactionId) return null;
			const res = await fetchRPC(
				client.money.transactions[":id"].$get({
					param: { id: transactionId },
				}),
			);
			return res;
		},
		enabled: !!transactionId,
	});

	const transactionData = transactionQuery.data?.data;

	const mutation = useMutation({
		mutationKey: ["deleteTransactionMutation"],
		mutationFn: async ({ id }: { id: string }) => {
			return await fetchRPC(
				client.money.transactions[":id"].$delete({
					param: { id },
				}),
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
				description: "Transaksi berhasil dihapus.",
				className: "bg-green-300 text-green-800",
			});
			queryClient.removeQueries({
				queryKey: ["transaction", transactionId],
			});
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			handleCloseModal();
		},
	});

	const handleCloseModal = () => {
		if (mutation.isPending) return;
		navigate({ to: "/transactions" });
	};

	const isModalOpen = Boolean(transactionId && transactionData);

	// Format amount for display
	const formatAmount = (amount: string | number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(Number(amount));
	};

	return (
		<AlertDialog open={isModalOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Ini akan menghapus
						transaksi{" "}
						<b className="text-foreground">
							{transactionData?.description || "ini"}
						</b>{" "}
						dengan jumlah{" "}
						<b className="text-foreground">
							{transactionData
								? formatAmount(transactionData.amount)
								: "-"}
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
						Batal
					</Button>
					<Button
						onClick={() => mutation.mutate({ id: transactionId })}
						disabled={mutation.isPending}
						variant="destructive"
					>
						Ya, Hapus
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
