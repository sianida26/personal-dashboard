import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { TbArrowLeft, TbPlayerPlay, TbAlertCircle } from "react-icons/tb";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute(
	"/_dashboardLayout/ambil-ujian/start/$ujianId",
)({
	component: StartUjianPage,
});

function StartUjianPage() {
	usePermissions("ujian.take");
	const navigate = useNavigate();
	const { ujianId } = Route.useParams();

	const { data: ujianList } = useQuery({
		queryKey: ["available-ujian"],
		queryFn: () =>
			fetchRPC(
				client.ujian.available.$get({
					query: { page: "1", limit: "50" },
				}),
			),
	});

	const ujian = ujianList?.data?.find((u) => u.id === ujianId);

	const startMutation = useMutation({
		mutationFn: async () => {
			const response = await client.ujian[":id"].start.$post({
				param: { id: ujianId },
			});
			if (!response.ok) {
				throw new Error("Failed to start ujian");
			}
			return response.json();
		},
		onSuccess: (data) => {
			navigate({
				to: "/ambil-ujian/$attemptId",
				params: { attemptId: data.attemptId },
			});
		},
	});

	if (!ujian) {
		return (
			<div className="p-6">
				<div className="text-center py-12">
					<TbAlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p className="text-muted-foreground">Ujian tidak ditemukan.</p>
					<Button
						className="mt-4"
						onClick={() => navigate({ to: "/ambil-ujian" })}
					>
						Kembali ke Daftar Ujian
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<Button
				variant="ghost"
				className="mb-4"
				onClick={() => navigate({ to: "/ambil-ujian" })}
			>
				<TbArrowLeft className="h-4 w-4 mr-2" />
				Kembali
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>{ujian.title}</CardTitle>
					{ujian.description && (
						<CardDescription>{ujian.description}</CardDescription>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Jumlah Soal:</span>
							<p className="font-medium">
								{Math.min(ujian.totalQuestions, ujian.maxQuestions)} soal
							</p>
						</div>
						{ujian.practiceMode && (
							<div>
								<span className="text-muted-foreground">Mode:</span>
								<p className="font-medium text-blue-600">Practice Mode</p>
								<p className="text-xs text-muted-foreground">
									Jawaban benar akan ditampilkan setelah menjawab
								</p>
							</div>
						)}
					</div>

					{ujian.hasAttempted && !ujian.allowResubmit && (
						<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
							<p className="text-sm text-yellow-800 dark:text-yellow-200">
								Anda sudah pernah mengerjakan ujian ini dan tidak dapat
								mengerjakan ulang.
							</p>
						</div>
					)}

					<div className="p-4 bg-muted rounded-lg">
						<h4 className="font-medium mb-2">Petunjuk:</h4>
						<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
							<li>Pastikan koneksi internet Anda stabil</li>
							<li>Jawab semua pertanyaan sebelum menyelesaikan ujian</li>
							<li>
								Anda dapat berpindah antar soal sebelum menyelesaikan
								ujian
							</li>
							{ujian.practiceMode && (
								<li>
									Mode latihan: Anda akan langsung melihat jawaban
									yang benar setelah menjawab setiap soal
								</li>
							)}
						</ul>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/ambil-ujian" })}
					>
						Batal
					</Button>
					<Button
						onClick={() => startMutation.mutate()}
						disabled={startMutation.isPending || !ujian.canStart}
					>
						<TbPlayerPlay className="h-4 w-4 mr-2" />
						{startMutation.isPending ? "Memulai..." : "Mulai Ujian"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
