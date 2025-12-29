import { useForm } from "@mantine/form";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Textarea,
} from "@repo/ui";
import type { updateUjianSchema } from "@repo/validation";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TbPlus, TbTrash } from "react-icons/tb";
import type { z } from "zod";
import { AddQuestionModal } from "@/components/AddQuestionModal";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout/ujian/edit/$ujianId")({
	component: RouteComponent,
	staticData: {
		title: "Edit Ujian",
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { ujianId: id } = Route.useParams();
	const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
	const isMutating = useIsMutating({
		mutationKey: ["edit-ujian", id],
	});

	const detailEndpoint = client.ujian[":id"].$get;

	const { data: ujianData, isLoading } = useQuery({
		queryKey: ["ujian", { id }],
		queryFn: () => fetchRPC(detailEndpoint({ param: { id } })),
	});

	const deleteQuestionMutation = useMutation({
		mutationFn: async (questionId: string) => {
			await fetchRPC(
				client.ujian.questions[":id"].$delete({
					param: { id: questionId },
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ujian", { id }] });
		},
	});

	const form = useForm<z.infer<typeof updateUjianSchema>>({
		initialValues: {
			title: "",
			description: "",
			maxQuestions: 10,
			shuffleQuestions: false,
			shuffleAnswers: false,
			practiceMode: false,
			allowResubmit: false,
			isActive: true,
		},
		validate: {
			title: (value: string | undefined) =>
				!value || value.length === 0
					? "Title is required"
					: value.length > 255
						? "Title must be less than 255 characters"
						: null,
			maxQuestions: (value: number | undefined) =>
				value && value < 1
					? "Max questions must be at least 1"
					: null,
		},
	});

	useEffect(() => {
		if (ujianData) {
			form.setValues({
				title: ujianData.title,
				description: ujianData.description || "",
				maxQuestions: ujianData.maxQuestions,
				shuffleQuestions: ujianData.shuffleQuestions,
				shuffleAnswers: ujianData.shuffleAnswers,
				practiceMode: ujianData.practiceMode,
				allowResubmit: ujianData.allowResubmit,
				isActive: ujianData.isActive,
			});
		}
	}, [ujianData]);

	const handleSubmit = async () => {
		try {
			await fetchRPC(
				client.ujian[":id"].$patch({
					param: { id },
					json: {
						title: form.values.title,
						description: form.values.description || undefined,
						maxQuestions: Number(form.values.maxQuestions),
						shuffleQuestions: form.values.shuffleQuestions,
						shuffleAnswers: form.values.shuffleAnswers,
						practiceMode: form.values.practiceMode,
						allowResubmit: form.values.allowResubmit,
						isActive: form.values.isActive,
					},
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["ujian"] });
			navigate({ to: "/ujian" });
		} catch (error) {
			console.error(error);
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-6">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Edit Ujian</CardTitle>
					<p className="text-sm text-muted-foreground">
						Edit ujian details and settings
					</p>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.onSubmit(handleSubmit)}
						className="space-y-6"
					>
						<div className="space-y-4">
							<div className="space-y-2">
								<label
									htmlFor="title"
									className="text-sm font-medium"
								>
									Title{" "}
									<span className="text-destructive">*</span>
								</label>
								<Input
									id="title"
									placeholder="Enter ujian title"
									{...form.getInputProps("title")}
									disabled={Boolean(isMutating)}
								/>
								{form.errors.title && (
									<p className="text-sm text-destructive">
										{form.errors.title}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="description"
									className="text-sm font-medium"
								>
									Description
								</label>
								<Textarea
									id="description"
									placeholder="Enter ujian description (optional)"
									rows={4}
									{...form.getInputProps("description")}
									disabled={Boolean(isMutating)}
								/>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="maxQuestions"
									className="text-sm font-medium"
								>
									Maximum Questions to Display
								</label>
								<Input
									id="maxQuestions"
									type="number"
									min={1}
									placeholder="10"
									{...form.getInputProps("maxQuestions")}
									disabled={Boolean(isMutating)}
								/>
								{form.errors.maxQuestions && (
									<p className="text-sm text-destructive">
										{form.errors.maxQuestions}
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									If you have more questions than this number,
									a random selection will be shown to
									students.
								</p>
							</div>
						</div>

						<div className="space-y-4 border-t pt-6">
							<h3 className="text-sm font-semibold">
								Exam Options
							</h3>

							<Checkbox
								label="Shuffle Questions"
								description="Questions will appear in random order for each student"
								{...form.getInputProps("shuffleQuestions", {
									type: "checkbox",
								})}
								disabled={Boolean(isMutating)}
							/>

							<Checkbox
								label="Shuffle Answers"
								description="Answer options will appear in random order for each student"
								{...form.getInputProps("shuffleAnswers", {
									type: "checkbox",
								})}
								disabled={Boolean(isMutating)}
							/>

							<Checkbox
								label="Practice Mode"
								description="Students will see correct answers immediately after submitting each answer"
								{...form.getInputProps("practiceMode", {
									type: "checkbox",
								})}
								disabled={Boolean(isMutating)}
							/>

							<Checkbox
								label="Allow Resubmit"
								description="Students can retake this exam multiple times"
								{...form.getInputProps("allowResubmit", {
									type: "checkbox",
								})}
								disabled={Boolean(isMutating)}
							/>

							<Checkbox
								label="Active"
								description="Only active ujian can be taken by students"
								{...form.getInputProps("isActive", {
									type: "checkbox",
								})}
								disabled={Boolean(isMutating)}
							/>
						</div>

						<div className="flex justify-end gap-2 border-t pt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/ujian" })}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={Boolean(isMutating)}
							>
								Save Changes
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Questions Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Questions</CardTitle>
							<p className="text-sm text-muted-foreground">
								Manage questions for this ujian
							</p>
						</div>
						<Button
							onClick={() => {
								setIsAddQuestionOpen(true);
							}}
						>
							<TbPlus className="h-4 w-4 mr-2" />
							Add Question
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{ujianData?.questions && ujianData.questions.length > 0 ? (
						<div className="space-y-3">
							{ujianData.questions.map((question, index) => (
								<div
									key={question.id}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Badge variant="outline">
												{index + 1}
											</Badge>
											<Badge>
												{question.questionType}
											</Badge>
											<span className="text-sm text-muted-foreground">
												{question.points} point
												{question.points !== 1 ? "s" : ""}
											</span>
										</div>
										<p className="text-sm">
											{question.questionText}
										</p>
									</div>
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												// TODO: Edit question
												alert(
													`Edit question: ${question.id}`,
												);
											}}
										>
											Edit
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="text-destructive hover:text-destructive"
											onClick={async () => {
												if (
													confirm(
														"Are you sure you want to delete this question?",
													)
												) {
													await deleteQuestionMutation.mutateAsync(
														question.id,
													);
												}
											}}
											disabled={deleteQuestionMutation.isPending}
										>
											<TbTrash className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<p className="text-sm text-muted-foreground mb-4">
								No questions added yet
							</p>
							<Button
								onClick={() => {
									setIsAddQuestionOpen(true);
								}}
							>
								<TbPlus className="h-4 w-4 mr-2" />
								Add First Question
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<AddQuestionModal
				open={isAddQuestionOpen}
				onOpenChange={setIsAddQuestionOpen}
				ujianId={id}
				nextOrderIndex={ujianData?.questions?.length || 0}
			/>
		</div>
	);
}
