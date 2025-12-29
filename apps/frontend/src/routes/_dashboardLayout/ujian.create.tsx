import { useForm } from "@mantine/form";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Textarea,
} from "@repo/ui";
import type { createUjianSchema } from "@repo/validation";
import { useIsMutating } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { z } from "zod";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout/ujian/create")({
	component: RouteComponent,
	staticData: {
		title: "Create Ujian",
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const isMutating = useIsMutating({
		mutationKey: ["create-ujian"],
	});

	const form = useForm<z.infer<typeof createUjianSchema>>({
		initialValues: {
			title: "",
			description: "",
			maxQuestions: 10,
			shuffleQuestions: false,
			shuffleAnswers: false,
			practiceMode: false,
			allowResubmit: false,
		},
		validate: {
			title: (value: string) =>
				!value || value.length === 0
					? "Title is required"
					: value.length > 255
						? "Title must be less than 255 characters"
						: null,
			maxQuestions: (value: number) =>
				value < 1 ? "Max questions must be at least 1" : null,
		},
	});

	const handleSubmit = async () => {
		try {
			const response = await fetchRPC(
				client.ujian.$post({
					json: {
						title: form.values.title,
						description: form.values.description || undefined,
						maxQuestions: Number(form.values.maxQuestions),
						shuffleQuestions: form.values.shuffleQuestions,
						shuffleAnswers: form.values.shuffleAnswers,
						practiceMode: form.values.practiceMode,
						allowResubmit: form.values.allowResubmit,
					},
				}),
			);
			navigate({ to: `/ujian/edit/${response.id}` });
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="container mx-auto py-6">
			<Card>
				<CardHeader>
					<CardTitle>Create Ujian</CardTitle>
					<p className="text-sm text-muted-foreground">
						Create a new ujian (exam). After creating, you can add
						questions to it.
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
								Create Ujian
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
