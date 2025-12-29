import { useForm } from "@mantine/form";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	Textarea,
} from "@repo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TbPlus, TbTrash } from "react-icons/tb";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

type QuestionOption = {
	id: string;
	text: string;
};

type QuestionType = "mcq" | "multiple_select" | "input";

interface AddQuestionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	ujianId: string;
	nextOrderIndex: number;
}

export function AddQuestionModal({
	open,
	onOpenChange,
	ujianId,
	nextOrderIndex,
}: AddQuestionModalProps) {
	const queryClient = useQueryClient();

	const form = useForm<{
		questionText: string;
		questionType: QuestionType;
		options: QuestionOption[];
		correctAnswer: string | string[];
		points: number;
	}>({
		initialValues: {
			questionText: "",
			questionType: "mcq",
			options: [
				{ id: "a", text: "" },
				{ id: "b", text: "" },
			],
			correctAnswer: "",
			points: 1,
		},
		validate: {
			questionText: (value) =>
				!value ? "Question text is required" : null,
			points: (value) => (value < 0 ? "Points must be at least 0" : null),
			options: (value, values) => {
				if (values.questionType === "input") return null;
				return value.some((opt) => !opt.text.trim())
					? "All options must have text"
					: null;
			},
			correctAnswer: (value, values) => {
				if (values.questionType === "mcq" && !value) {
					return "Please select the correct answer";
				}
				if (
					values.questionType === "multiple_select" &&
					Array.isArray(value) &&
					value.length === 0
				) {
					return "Please select at least one correct answer";
				}
				if (values.questionType === "input" && !value) {
					return "Please enter the correct answer";
				}
				return null;
			},
		},
	});

	const addQuestionMutation = useMutation({
		mutationFn: async (data: {
			questionText: string;
			questionType: QuestionType;
			options: QuestionOption[] | null;
			correctAnswer: string | string[];
			points: number;
			orderIndex: number;
		}) => {
			await fetchRPC(
				client.ujian[":id"].questions.$post({
					param: { id: ujianId },
					json: data,
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ujian", { id: ujianId }] });
			onOpenChange(false);
			form.reset();
		},
	});

	const handleSubmit = () => {
		const values = form.values;
		const isInput = values.questionType === "input";

		addQuestionMutation.mutate({
			questionText: values.questionText,
			questionType: values.questionType,
			options: isInput ? null : values.options,
			correctAnswer: values.correctAnswer,
			points: Number(values.points),
			orderIndex: nextOrderIndex,
		});
	};

	const handleQuestionTypeChange = (value: QuestionType) => {
		form.setFieldValue("questionType", value);
		
		// Reset correctAnswer based on type
		if (value === "mcq") {
			form.setFieldValue("correctAnswer", "");
		} else if (value === "multiple_select") {
			form.setFieldValue("correctAnswer", []);
		} else {
			form.setFieldValue("correctAnswer", "");
		}
	};

	const addOption = () => {
		const lastOption = form.values.options[form.values.options.length - 1];
		const nextId = String.fromCharCode(lastOption.id.charCodeAt(0) + 1);
		form.setFieldValue("options", [
			...form.values.options,
			{ id: nextId, text: "" },
		]);
	};

	const removeOption = (index: number) => {
		if (form.values.options.length > 2) {
			const newOptions = form.values.options.filter((_, i) => i !== index);
			form.setFieldValue("options", newOptions);
		}
	};

	const updateOptionText = (index: number, text: string) => {
		const newOptions = [...form.values.options];
		newOptions[index].text = text;
		form.setFieldValue("options", newOptions);
	};

	const toggleCorrectAnswer = (optionId: string) => {
		if (form.values.questionType === "mcq") {
			form.setFieldValue("correctAnswer", optionId);
		} else if (form.values.questionType === "multiple_select") {
			const current = form.values.correctAnswer as string[];
			if (current.includes(optionId)) {
				form.setFieldValue(
					"correctAnswer",
					current.filter((id) => id !== optionId),
				);
			} else {
				form.setFieldValue("correctAnswer", [...current, optionId]);
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Question</DialogTitle>
				</DialogHeader>

				<form onSubmit={form.onSubmit(handleSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="questionText">
							Question Text <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id="questionText"
							placeholder="Enter your question"
							rows={3}
							{...form.getInputProps("questionText")}
						/>
						{form.errors.questionText && (
							<p className="text-sm text-destructive">
								{form.errors.questionText}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Select
								label="Question Type"
								value={form.values.questionType}
								options={[
									{ value: "mcq", label: "Multiple Choice (Single Answer)" },
									{ value: "multiple_select", label: "Multiple Choice (Multiple Answers)" },
									{ value: "input", label: "Text Input" },
								]}
								onChange={(value) => handleQuestionTypeChange(value as QuestionType)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="points">Points</Label>
							<Input
								id="points"
								type="number"
								min={0}
								{...form.getInputProps("points")}
							/>
							{form.errors.points && (
								<p className="text-sm text-destructive">
									{form.errors.points}
								</p>
							)}
						</div>
					</div>

					{form.values.questionType !== "input" ? (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Options</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addOption}
								>
									<TbPlus className="h-4 w-4 mr-2" />
									Add Option
								</Button>
							</div>

							<div className="space-y-2">
								{form.values.options.map((option, index) => (
									<div key={option.id} className="flex gap-2 items-start">
										<div className="flex items-center pt-2">
											<input
												type={
													form.values.questionType === "mcq" ? "radio" : "checkbox"
												}
												name="correctAnswer"
												checked={
													form.values.questionType === "mcq"
														? form.values.correctAnswer === option.id
														: (
																form.values
																	.correctAnswer as string[]
															).includes(option.id)
												}
												onChange={() => toggleCorrectAnswer(option.id)}
												className="h-4 w-4"
											/>
										</div>
										<div className="flex-1">
											<div className="flex gap-2">
												<Badge variant="outline" className="mt-2">
													{option.id.toUpperCase()}
												</Badge>
												<Input
													placeholder="Option text"
													value={option.text}
													onChange={(e) =>
														updateOptionText(index, e.target.value)
													}
												/>
												{form.values.options.length > 2 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeOption(index)}
														className="text-destructive"
													>
														<TbTrash className="h-4 w-4" />
													</Button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
							{form.errors.options && (
								<p className="text-sm text-destructive">
									{form.errors.options}
								</p>
							)}
							{form.errors.correctAnswer && (
								<p className="text-sm text-destructive">
									{form.errors.correctAnswer}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								{form.values.questionType === "mcq"
									? "Select one correct answer"
									: "Select all correct answers"}
							</p>
						</div>
					) : (
						<div className="space-y-2">
							<Label htmlFor="correctAnswerInput">
								Correct Answer <span className="text-destructive">*</span>
							</Label>
							<Input
								id="correctAnswerInput"
								placeholder="Enter the correct answer"
								value={form.values.correctAnswer as string}
								onChange={(e) =>
									form.setFieldValue("correctAnswer", e.target.value)
								}
							/>
							{form.errors.correctAnswer && (
								<p className="text-sm text-destructive">
									{form.errors.correctAnswer}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Students must type this exact answer
							</p>
						</div>
					)}

					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={addQuestionMutation.isPending}>
							Add Question
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
