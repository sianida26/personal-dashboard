import { Badge, Button, Card, CardContent, Select } from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	TbArrowLeft,
	TbClock,
	TbEye,
	TbHistory,
	TbPlayerPlay,
} from "react-icons/tb";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute(
	"/_dashboardLayout/ambil-ujian/riwayat",
)({
	component: RiwayatPage,
});

function RiwayatPage() {
	usePermissions("ujian.take");
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { data, isLoading, error } = useQuery({
		queryKey: ["my-attempts", statusFilter],
		queryFn: () =>
			fetchRPC(
				client.ujian["my-attempts"].$get({
					query: {
						page: "1",
						limit: "50",
						status: statusFilter as
							| "in_progress"
							| "completed"
							| "abandoned"
							| "all",
					},
				}),
			),
	});

	if (isLoading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-muted rounded w-1/4" />
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-24 bg-muted rounded" />
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
						Gagal memuat riwayat ujian. Silakan coba lagi.
					</p>
				</div>
			</div>
		);
	}

	const attempts = data?.data ?? [];

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return <Badge className="bg-green-600">Selesai</Badge>;
			case "in_progress":
				return <Badge variant="default">Sedang Dikerjakan</Badge>;
			case "abandoned":
				return <Badge variant="destructive">Dibatalkan</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const getScoreColor = (score: number | null) => {
		if (score === null) return "";
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	const formatDate = (date: string | Date | null) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						onClick={() => navigate({ to: "/ambil-ujian" })}
					>
						<TbArrowLeft className="h-4 w-4 mr-2" />
						Kembali
					</Button>
					<div>
						<h1 className="text-2xl font-bold">Riwayat Ujian</h1>
						<p className="text-muted-foreground">
							Lihat semua ujian yang pernah Anda kerjakan
						</p>
					</div>
				</div>
				<Select
					value={statusFilter}
					onChange={setStatusFilter}
					options={[
						{ value: "all", label: "Semua" },
						{ value: "completed", label: "Selesai" },
						{ value: "in_progress", label: "Sedang Dikerjakan" },
						{ value: "abandoned", label: "Dibatalkan" },
					]}
					placeholder="Filter Status"
					className="w-[180px]"
				/>
			</div>

			{/* Attempts List */}
			{attempts.length === 0 ? (
				<div className="text-center py-12">
					<TbHistory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p className="text-muted-foreground">
						{statusFilter === "all"
							? "Anda belum pernah mengerjakan ujian."
							: `Tidak ada ujian dengan status "${statusFilter}".`}
					</p>
					<Button
						className="mt-4"
						onClick={() => navigate({ to: "/ambil-ujian" })}
					>
						Kerjakan Ujian Sekarang
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{attempts.map((attempt) => (
						<Card key={attempt.id}>
							<CardContent className="py-4">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<h3 className="font-medium">
												{attempt.ujianTitle}
											</h3>
											{getStatusBadge(attempt.status)}
											{attempt.practiceMode && (
												<Badge variant="secondary">
													Practice Mode
												</Badge>
											)}
										</div>
										{attempt.ujianDescription && (
											<p className="text-sm text-muted-foreground line-clamp-1">
												{attempt.ujianDescription}
											</p>
										)}
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center gap-1">
												<TbClock className="h-4 w-4" />
												{formatDate(attempt.startedAt)}
											</span>
											{attempt.status === "completed" &&
												attempt.score !== null && (
													<span
														className={`font-medium ${getScoreColor(attempt.score)}`}
													>
														Nilai:{" "}
														{attempt.score.toFixed(1)}%
													</span>
												)}
										</div>
									</div>
									<div className="flex gap-2">
										{attempt.status === "in_progress" ? (
											<Button
												onClick={() =>
													navigate({
														to: "/ambil-ujian/$attemptId",
														params: {
															attemptId: attempt.id,
														},
													})
												}
											>
												<TbPlayerPlay className="h-4 w-4 mr-2" />
												Lanjutkan
											</Button>
										) : (
											<Button
												variant="outline"
												onClick={() =>
													navigate({
														to: "/ambil-ujian/results/$attemptId",
														params: {
															attemptId: attempt.id,
														},
													})
												}
											>
												<TbEye className="h-4 w-4 mr-2" />
												Lihat Hasil
											</Button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
