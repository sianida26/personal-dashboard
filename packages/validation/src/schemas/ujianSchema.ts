import { z } from "zod";

// Question type enum
export const questionTypeSchema = z.enum(["mcq", "multiple_select", "input"]);

// Question option schema
export const questionOptionSchema = z.object({
	id: z.string(),
	text: z.string(),
});

// Create ujian schema
export const createUjianSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	maxQuestions: z.number().int().min(1).default(10),
	shuffleQuestions: z.boolean().default(false),
	shuffleAnswers: z.boolean().default(false),
	practiceMode: z.boolean().default(false),
	allowResubmit: z.boolean().default(false),
});

// Update ujian schema
export const updateUjianSchema = createUjianSchema.partial().extend({
	isActive: z.boolean().optional(),
});

// Create question schema
export const createQuestionSchema = z.object({
	questionText: z.string().min(1),
	questionType: questionTypeSchema,
	options: z.array(questionOptionSchema).nullable().optional(),
	correctAnswer: z.union([z.string(), z.array(z.string())]),
	points: z.number().int().min(0).default(1),
	orderIndex: z.number().int().min(0),
});

// Update question schema
export const updateQuestionSchema = createQuestionSchema.partial();

// Submit answer schema
export const submitAnswerSchema = z.object({
	questionId: z.string(),
	userAnswer: z.union([z.string(), z.array(z.string())]),
});
