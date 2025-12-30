import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	RadioGroup,
	RadioGroupItem,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
	TbArrowLeft,
	TbArrowRight,
	TbCheck,
	TbCircleCheck,
	TbCircleX,
	TbFlag,
} from "react-icons/tb";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute(
	"/_dashboardLayout/ambil-ujian/$attemptId",
)({
	component: TakeUjianPage,
});

interface QuestionOption {
	id: string;
	text: string;
}

interface Question {
	id: string;
	questionText: string;
	questionType: "mcq" | "multiple_select" | "input";
	options: QuestionOption[] | null;
	points: number | null;
	userAnswer?: string | string[];
	isCorrect?: boolean | null;
	correctAnswer?: string | string[];
}

interface AttemptData {
	attemptId: string;
	ujian: {
		id: string;
		title: string;
		description: string | null;
		practiceMode: boolean | null;
	};
	questions: Question[];
	isResuming: boolean;
}

interface Answer {
	questionId: string;
	userAnswer: string | string[];
	isCorrect?: boolean | null;
	correctAnswer?: string | string[];
}

function TakeUjianPage() {
	usePermissions("ujian.take");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { attemptId } = Route.useParams();

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
	const [currentAnswer, setCurrentAnswer] = useState<string | string[]>("");

	// First, get the attempt to find the ujianId
	const { data: attemptInfo } = useQuery({
		queryKey: ["attempt-info", attemptId],
		queryFn: async () => {
			const response = await client.ujian["my-attempts"].$get({
				query: { page: "1", limit: "100", status: "all" },
			});
			if (!response.ok) {
				throw new Error("Failed to load attempts");
			}
			const data = await response.json();
			const attempt = data.data?.find((a: any) => a.id === attemptId);
			if (!attempt) {
				throw new Error("Attempt not found");
			}
			return attempt;
		},
		retry: false,
	});

	const { data: attemptData, isLoading } = useQuery<AttemptData | null>({
		queryKey: ["ujian-attempt", attemptId, attemptInfo?.ujianId],
		queryFn: async () => {
			if (!attemptInfo?.ujianId) return null;
			const response = await client.ujian[":id"].start.$post({
				param: { id: attemptInfo.ujianId },
			});
			if (!response.ok) {
				throw new Error("Failed to load ujian");
			}
			return response.json();
		},
		enabled: !!attemptInfo?.ujianId,
		retry: false,
	});

	const submitAnswerMutation = useMutation({
		mutationFn: (params: { questionId: string; userAnswer: string | string[] }) =>
			fetchRPC(
				client.ujian.attempts[":id"].answer.$post({
					param: { id: attemptId },
					json: params,
				}),
			),
		onSuccess: (data, variables) => {
			const newAnswers = new Map(answers);
			const responseData = data as {
				answerId: string;
				isCorrect?: boolean;
				correctAnswer?: string | string[];
				message: string;
			};
			newAnswers.set(variables.questionId, {
				questionId: variables.questionId,
				userAnswer: variables.userAnswer,
				isCorrect: responseData.isCorrect,
				correctAnswer: responseData.correctAnswer,
			});
			setAnswers(newAnswers);
		},
	});

	const completeMutation = useMutation({
		mutationFn: () =>
			fetchRPC(
				client.ujian.attempts[":id"].complete.$post({
					param: { id: attemptId },
				}),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["available-ujian"] });
			navigate({
				to: "/ambil-ujian/results/$attemptId",
				params: { attemptId },
			});
		},
	});

	const questions = (attemptData?.questions ?? []) as Question[];
	const currentQuestion = questions[currentQuestionIndex];
	const practiceMode = attemptData?.ujian?.practiceMode ?? false;

	// Initialize answers from loaded data when attempt data is available
	useEffect(() => {
		if (attemptData?.questions && answers.size === 0) {
			console.log("🔄 Initializing answers from loaded data...");
			console.log("Questions with userAnswer:", attemptData.questions.filter(q => q.userAnswer).length);
			
			const initialAnswers = new Map<string, Answer>();
			for (const question of attemptData.questions) {
				if (question.userAnswer) {
					console.log(`  ✅ Loading answer for question ${question.id}:`, {
						userAnswer: question.userAnswer,
						isCorrect: question.isCorrect,
						correctAnswer: question.correctAnswer,
					});
					initialAnswers.set(question.id, {
						questionId: question.id,
						userAnswer: question.userAnswer,
						isCorrect: question.isCorrect,
						correctAnswer: question.correctAnswer,
					});
				}
			}
			if (initialAnswers.size > 0) {
				console.log(`📊 Loaded ${initialAnswers.size} existing answers`);
				setAnswers(initialAnswers);
			} else {
				console.log("ℹ️  No existing answers found");
			}
		}
	}, [attemptData, answers.size]);

	// Load saved answer when question changes
	useEffect(() => {
		if (currentQuestion) {
			const savedAnswer = answers.get(currentQuestion.id);
			if (savedAnswer) {
				setCurrentAnswer(savedAnswer.userAnswer);
			} else {
				setCurrentAnswer(
					currentQuestion.questionType === "multiple_select" ? [] : "",
				);
			}
		}
	}, [currentQuestionIndex, currentQuestion, answers]);

	if (isLoading) {
		return (
			<div className="p-6 flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Memuat soal ujian...</p>
				</div>
			</div>
		);
	}

	if (!attemptData || questions.length === 0) {
		return (
			<div className="p-6">
				<div className="text-center py-12">
					<p className="text-destructive mb-4">
						Gagal memuat ujian. Silakan coba lagi.
					</p>
					<Button onClick={() => navigate({ to: "/ambil-ujian" })}>
						Kembali ke Daftar Ujian
					</Button>
				</div>
			</div>
		);
	}

	const handleSubmitAnswer = () => {
		if (!currentQuestion || !currentAnswer) return;

		submitAnswerMutation.mutate({
			questionId: currentQuestion.id,
			userAnswer: currentAnswer,
		});
	};

	const handleNextQuestion = () => {
		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		}
	};

	const handlePrevQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	const currentSavedAnswer = answers.get(currentQuestion?.id ?? "");
	const isAnswered = currentSavedAnswer !== undefined;
	const allAnswered = questions.every((q) => answers.has(q.id));

	const renderQuestionInput = () => {
		if (!currentQuestion) return null;

		switch (currentQuestion.questionType) {
			case "mcq":
				return (
					<RadioGroup
						value={currentAnswer as string}
						onValueChange={(value) => setCurrentAnswer(value)}
						disabled={isAnswered && practiceMode}
						className="space-y-3"
					>
						{currentQuestion.options?.map((option, idx) => (
							<div
								key={option.id}
								className={`flex items-center space-x-3 p-3 rounded-lg border ${
									isAnswered && practiceMode
										? option.id === currentSavedAnswer?.correctAnswer
											? "bg-green-50 border-green-500 dark:bg-green-900/20"
											: option.id === currentSavedAnswer?.userAnswer &&
											  !currentSavedAnswer?.isCorrect
											? "bg-red-50 border-red-500 dark:bg-red-900/20"
											: ""
										: "hover:bg-muted"
								}`}
							>
								<RadioGroupItem value={option.id} id={`option-${idx}`} />
								<label
									htmlFor={`option-${idx}`}
									className="flex-1 cursor-pointer"
								>
									{option.text}
								</label>
								{isAnswered && practiceMode && (
									<>
										{option.id === currentSavedAnswer?.correctAnswer && (
											<TbCircleCheck className="h-5 w-5 text-green-600" />
										)}
										{option.id === currentSavedAnswer?.userAnswer &&
											!currentSavedAnswer?.isCorrect && (
												<TbCircleX className="h-5 w-5 text-red-600" />
											)}
									</>
								)}
							</div>
						))}
					</RadioGroup>
				);

			case "multiple_select":
				return (
					<div className="space-y-3">
						{currentQuestion.options?.map((option) => {
							const selectedOptions = currentAnswer as string[];
							const isSelected = selectedOptions.includes(option.id);
							const correctAnswers =
								(currentSavedAnswer?.correctAnswer as string[]) ?? [];

							return (
								<div
									key={option.id}
									className={`flex items-center space-x-3 p-3 rounded-lg border ${
										isAnswered && practiceMode
											? correctAnswers.includes(option.id)
												? "bg-green-50 border-green-500 dark:bg-green-900/20"
												: isSelected && !correctAnswers.includes(option.id)
												? "bg-red-50 border-red-500 dark:bg-red-900/20"
												: ""
											: "hover:bg-muted"
									}`}
								>
									<Checkbox
										checked={isSelected}
										onCheckedChange={(checked) => {
											if (isAnswered && practiceMode) return;
											const newSelected = checked
												? [...selectedOptions, option.id]
												: selectedOptions.filter((o) => o !== option.id);
											setCurrentAnswer(newSelected);
										}}
										disabled={isAnswered && practiceMode}
									/>
									<span className="flex-1">{option.text}</span>
									{isAnswered && practiceMode && (
										<>
											{correctAnswers.includes(option.id) && (
												<TbCircleCheck className="h-5 w-5 text-green-600" />
											)}
											{isSelected && !correctAnswers.includes(option.id) && (
												<TbCircleX className="h-5 w-5 text-red-600" />
											)}
										</>
									)}
								</div>
							);
						})}
					</div>
				);

			case "input":
				return (
					<div className="space-y-3">
						<Input
							value={currentAnswer as string}
							onChange={(e) => setCurrentAnswer(e.target.value)}
							placeholder="Ketik jawaban Anda..."
							disabled={isAnswered && practiceMode}
							className={
								isAnswered && practiceMode
									? currentSavedAnswer?.isCorrect
										? "border-green-500"
										: "border-red-500"
									: ""
							}
						/>
						{isAnswered && practiceMode && (
							<div
								className={`p-3 rounded-lg ${
									currentSavedAnswer?.isCorrect
										? "bg-green-50 dark:bg-green-900/20"
										: "bg-red-50 dark:bg-red-900/20"
								}`}
							>
								{currentSavedAnswer?.isCorrect ? (
									<p className="text-green-700 dark:text-green-300 flex items-center gap-2">
										<TbCircleCheck className="h-5 w-5" />
										Jawaban Anda benar!
									</p>
								) : (
									<p className="text-red-700 dark:text-red-300">
										<span className="flex items-center gap-2">
											<TbCircleX className="h-5 w-5" />
											Jawaban Anda salah.
										</span>
										<span className="block mt-1">
											Jawaban yang benar:{" "}
											<strong>{currentSavedAnswer?.correctAnswer}</strong>
										</span>
									</p>
								)}
							</div>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold">{attemptData.ujian.title}</h1>
					<p className="text-sm text-muted-foreground">
						Soal {currentQuestionIndex + 1} dari {questions.length}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{practiceMode && (
						<Badge variant="secondary">Practice Mode</Badge>
					)}
					<Badge variant="outline">
						{answers.size} / {questions.length} dijawab
					</Badge>
				</div>
			</div>

			{/* Question Navigation */}
			<div className="flex flex-wrap gap-2">
				{questions.map((q, idx) => {
					const answer = answers.get(q.id);
					return (
						<Button
							key={q.id}
							variant={idx === currentQuestionIndex ? "default" : "outline"}
							size="sm"
							className={`w-10 h-10 ${
								answer
									? practiceMode
										? answer.isCorrect
											? "bg-green-600 hover:bg-green-700 text-white"
											: "bg-red-600 hover:bg-red-700 text-white"
										: "bg-blue-600 hover:bg-blue-700 text-white"
									: ""
							}`}
							onClick={() => setCurrentQuestionIndex(idx)}
						>
							{idx + 1}
						</Button>
					);
				})}
			</div>

			{/* Question Card */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<CardTitle className="text-lg">
							{currentQuestion?.questionText}
						</CardTitle>
						<Badge variant="outline">{currentQuestion?.points ?? 1} poin</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{renderQuestionInput()}

					{/* Submit Answer Button (for practice mode or first submit) */}
					{!isAnswered && (
						<Button
							onClick={handleSubmitAnswer}
							disabled={
								!currentAnswer ||
								(Array.isArray(currentAnswer) && currentAnswer.length === 0) ||
								submitAnswerMutation.isPending
							}
							className="w-full"
						>
							<TbCheck className="h-4 w-4 mr-2" />
							{submitAnswerMutation.isPending
								? "Menyimpan..."
								: "Simpan Jawaban"}
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					onClick={handlePrevQuestion}
					disabled={currentQuestionIndex === 0}
				>
					<TbArrowLeft className="h-4 w-4 mr-2" />
					Sebelumnya
				</Button>

				<div className="flex gap-2">
					{currentQuestionIndex === questions.length - 1 ? (
						<Button
							onClick={() => completeMutation.mutate()}
							disabled={!allAnswered || completeMutation.isPending}
						>
							<TbFlag className="h-4 w-4 mr-2" />
							{completeMutation.isPending
								? "Menyelesaikan..."
								: "Selesaikan Ujian"}
						</Button>
					) : (
						<Button onClick={handleNextQuestion}>
							Selanjutnya
							<TbArrowRight className="h-4 w-4 ml-2" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
