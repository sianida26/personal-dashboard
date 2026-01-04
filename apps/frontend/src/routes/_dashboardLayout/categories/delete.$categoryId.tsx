import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { toast } from "sonner";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute(
	"/_dashboardLayout/categories/delete/$categoryId",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { categoryId } = useParams({
		from: "/_dashboardLayout/categories/delete/$categoryId",
	});

	// Fetch current category data
	const { data: categoryResponse, isLoading } = useQuery({
		queryKey: ["category", categoryId],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.categories[":id"].$get({
					param: { id: categoryId },
				}),
			);
			return res;
		},
	});

	const category = categoryResponse?.data;

	const deleteMutation = useMutation({
		mutationKey: ["delete-category", categoryId],
		mutationFn: async () => {
			await fetchRPC(
				client.money.categories[":id"].$delete({
					param: { id: categoryId },
				}),
			);
		},
		onSuccess: () => {
			toast.success("Kategori berhasil dihapus", {
				description: `Kategori "${category?.name}" telah dihapus.`,
			});
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			navigate({ to: "/categories" });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Terjadi kesalahan saat menghapus kategori.";
			toast.error("Gagal menghapus kategori", {
				description: errorMessage,
			});
		},
	});

	const handleClose = () => {
		navigate({ to: "/categories" });
	};

	return (
		<Dialog open onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Hapus Kategori</DialogTitle>
					<DialogDescription>
						{isLoading ? (
							"Memuat..."
						) : (
							<>
								Apakah Anda yakin ingin menghapus kategori{" "}
								<strong>"{category?.name}"</strong>?
								<br />
								<br />
								<span className="text-destructive">
									Peringatan: Transaksi yang menggunakan
									kategori ini akan kehilangan kategorinya.
									Tindakan ini tidak dapat dibatalkan.
								</span>
							</>
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={deleteMutation.isPending}
					>
						Batal
					</Button>
					<Button
						variant="destructive"
						onClick={() => deleteMutation.mutate()}
						disabled={isLoading || deleteMutation.isPending}
					>
						{deleteMutation.isPending ? "Menghapus..." : "Hapus"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
