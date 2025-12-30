import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import {
	TbArrowLeft,
	TbCircleCheck,
	TbCircleX,
	TbRefresh,
	TbTrophy,
} from "react-icons/tb";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute(
	"/_dashboardLayout/ambil-ujian/results/$attemptId",
)({
	component: ResultsPage,
});

function ResultsPage() {
	usePermissions("ujian.take");
	const navigate = useNavigate();
	const { attemptId } = Route.useParams();

	const { data, isLoading, error } = useQuery({
		queryKey: ["ujian-results", attemptId],
		queryFn: () =>
			fetchRPC(
				client.ujian.attempts[":id"].results.$get({
					param: { id: attemptId },
				}),
			),
	});

	if (isLoading) {
		return (
			<div className="p-6 flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Memuat hasil ujian...</p>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="p-6">
				<div className="text-center py-12">
					<p className="text-destructive mb-4">
						Gagal memuat hasil ujian. Silakan coba lagi.
					</p>
					<Button onClick={() => navigate({ to: "/ambil-ujian" })}>
						Kembali ke Daftar Ujian
					</Button>
				</div>
			</div>
		);
	}

	// If not completed yet, redirect to take ujian
	if (data.status !== "completed") {
		navigate({
			to: "/ambil-ujian/$attemptId",
			params: { attemptId },
		});
		return null;
	}

	const score = data.score ?? 0;
	const summary = data.summary;

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	const getScoreMessage = (score: number) => {
		if (score >= 90) return "Luar Biasa! 🎉";
		if (score >= 80) return "Sangat Baik! 👏";
		if (score >= 70) return "Baik! 👍";
		if (score >= 60) return "Cukup Baik";
		return "Perlu Belajar Lebih Giat";
	};

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					onClick={() => navigate({ to: "/ambil-ujian" })}
				>
					<TbArrowLeft className="h-4 w-4 mr-2" />
					Kembali ke Daftar Ujian
				</Button>
			</div>

			{/* Score Summary Card */}
			<Card>
				<CardContent className="pt-6">
					<div className="text-center space-y-4">
						<TbTrophy className="h-16 w-16 mx-auto text-yellow-500" />
						<div>
							<h1 className="text-2xl font-bold">
								{data.ujian.title}
							</h1>
							<p className="text-muted-foreground">
								Ujian telah selesai
							</p>
						</div>
						<div
							className={`text-6xl font-bold ${getScoreColor(score)}`}
						>
							{score.toFixed(1)}%
						</div>
						<p className="text-lg">{getScoreMessage(score)}</p>

						{summary && (
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
								<div className="p-4 bg-muted rounded-lg">
									<div className="text-2xl font-bold">
										{summary.totalQuestions}
									</div>
									<div className="text-sm text-muted-foreground">
										Total Soal
									</div>
								</div>
								<div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
									<div className="text-2xl font-bold text-green-600">
										{summary.correctAnswers}
									</div>
									<div className="text-sm text-muted-foreground">
										Benar
									</div>
								</div>
								<div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
									<div className="text-2xl font-bold text-red-600">
										{summary.incorrectAnswers}
									</div>
									<div className="text-sm text-muted-foreground">
										Salah
									</div>
								</div>
								<div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
									<div className="text-2xl font-bold text-blue-600">
										{summary.totalPointsEarned}/
										{data.totalPoints}
									</div>
									<div className="text-sm text-muted-foreground">
										Poin
									</div>
								</div>
							</div>
						)}

						<div className="pt-4 flex justify-center gap-2">
							<Button
								variant="outline"
								onClick={() =>
									navigate({ to: "/ambil-ujian/riwayat" })
								}
							>
								Lihat Riwayat
							</Button>
							<Button
								onClick={() => navigate({ to: "/ambil-ujian" })}
							>
								<TbRefresh className="h-4 w-4 mr-2" />
								Kerjakan Ujian Lain
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Answer Details */}
			<Card>
				<CardHeader>
					<CardTitle>Detail Jawaban</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{data.answers.map((answer, idx) => (
						<div
							key={answer.questionId}
							className={`p-4 rounded-lg border ${
								answer.isCorrect
									? "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900"
									: "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900"
							}`}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<Badge variant="outline">
											Soal {idx + 1}
										</Badge>
										{answer.isCorrect ? (
											<Badge className="bg-green-600">
												<TbCircleCheck className="h-3 w-3 mr-1" />
												Benar
											</Badge>
										) : (
											<Badge variant="destructive">
												<TbCircleX className="h-3 w-3 mr-1" />
												Salah
											</Badge>
										)}
										<span className="text-sm text-muted-foreground">
											{answer.pointsEarned}/{answer.maxPoints}{" "}
											poin
										</span>
									</div>
									<div
										className="prose prose-sm max-w-none dark:prose-invert mb-3"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: Question text is trusted from admin
										dangerouslySetInnerHTML={{
											__html: answer.questionText ?? "",
										}}
									/>
									<div className="space-y-2 text-sm">
										<div className="flex gap-2">
											<span className="text-muted-foreground min-w-[100px]">
												Jawaban Anda:
											</span>
											<span
												className={
													answer.isCorrect
														? "text-green-600 font-medium"
														: "text-red-600"
												}
											>
												{formatAnswer(
													answer.userAnswer,
													answer.options,
												)}
											</span>
										</div>
										{!answer.isCorrect && (
											<div className="flex gap-2">
												<span className="text-muted-foreground min-w-[100px]">
													Jawaban Benar:
												</span>
												<span className="text-green-600 font-medium">
													{formatAnswer(
														answer.correctAnswer,
														answer.options,
													)}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function formatAnswer(
	answer: string | string[] | undefined,
	options?: { id: string; text: string }[] | null,
): string {
	if (!answer) return "-";

	if (Array.isArray(answer)) {
		if (options) {
			return answer
				.map((a) => options.find((o) => o.id === a)?.text ?? a)
				.join(", ");
		}
		return answer.join(", ");
	}

	if (options) {
		const option = options.find((o) => o.id === answer);
		if (option) return option.text;
	}

	return answer;
}
