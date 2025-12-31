import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { TbPlayerPlay, TbRotate, TbBook2 } from "react-icons/tb";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute("/_dashboardLayout/ambil-ujian")({
	component: AmbilUjianPage,
});

export default function AmbilUjianPage() {
	usePermissions("ujian.take");
	const navigate = useNavigate();

	const { data, isLoading, error } = useQuery({
		queryKey: ["available-ujian"],
		queryFn: () =>
			fetchRPC(
				client.ujian.available.$get({
					query: { page: "1", limit: "50" },
				}),
			),
	});

	if (isLoading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-muted rounded w-1/4" />
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-48 bg-muted rounded" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="text-center py-12">
					<p className="text-destructive">
						Gagal memuat daftar ujian. Silakan coba lagi.
					</p>
				</div>
			</div>
		);
	}

	const ujianList = data?.data ?? [];

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Ambil Ujian</h1>
				<p className="text-muted-foreground">
					Pilih ujian yang ingin Anda kerjakan
				</p>
			</div>

			{ujianList.length === 0 ? (
				<div className="text-center py-12">
					<TbBook2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p className="text-muted-foreground">
						Tidak ada ujian yang tersedia saat ini.
					</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{ujianList.map((ujian) => (
						<Card key={ujian.id} className="flex flex-col">
							<CardHeader>
								<div className="flex items-start justify-between">
									<CardTitle className="text-lg line-clamp-2">
										{ujian.title}
									</CardTitle>
									{ujian.practiceMode && (
										<Badge variant="secondary">
											Practice Mode
										</Badge>
									)}
								</div>
								{ujian.description && (
									<CardDescription className="line-clamp-2">
										{ujian.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent className="flex-1">
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Jumlah Soal:
										</span>
										<span className="font-medium">
											{Math.min(
												ujian.totalQuestions,
												ujian.maxQuestions,
											)}{" "}
											soal
										</span>
									</div>
									{ujian.allowResubmit && (
										<div className="flex items-center gap-1 text-muted-foreground">
											<TbRotate className="h-4 w-4" />
											<span>Dapat dikerjakan ulang</span>
										</div>
									)}
									{ujian.hasAttempted && (
										<Badge
											variant={
												ujian.hasInProgressAttempt
													? "default"
													: "outline"
											}
										>
											{ujian.hasInProgressAttempt
												? "Sedang Dikerjakan"
												: "Sudah Dikerjakan"}
										</Badge>
									)}
								</div>
							</CardContent>
							<CardFooter>
								<Button
									className="w-full"
									onClick={() => {
										if (ujian.inProgressAttemptId) {
											navigate({
												to: "/ambil-ujian/$attemptId",
												params: {
													attemptId:
														ujian.inProgressAttemptId,
												},
											});
										} else {
											navigate({
												to: "/ambil-ujian/start/$ujianId",
												params: { ujianId: ujian.id },
											});
										}
									}}
									disabled={!ujian.canStart}
								>
									<TbPlayerPlay className="h-4 w-4 mr-2" />
									{ujian.hasInProgressAttempt
										? "Lanjutkan"
										: ujian.hasAttempted
											? "Kerjakan Ulang"
											: "Mulai Ujian"}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
