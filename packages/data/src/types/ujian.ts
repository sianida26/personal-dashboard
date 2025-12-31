export type QuestionType = "mcq" | "multiple_select" | "input";

export type QuestionOption = {
	id: string;
	text: string;
};

export type Ujian = {
	id: string;
	title: string;
	description: string | null;
	maxQuestions: number;
	shuffleQuestions: boolean;
	shuffleAnswers: boolean;
	practiceMode: boolean;
	allowResubmit: boolean;
	isActive: boolean;
	createdBy: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type UjianQuestion = {
	id: string;
	ujianId: string;
	questionText: string;
	questionType: QuestionType;
	options: QuestionOption[] | null;
	correctAnswer: string | string[];
	points: number;
	orderIndex: number;
	createdAt: Date;
	updatedAt: Date;
};

export type AttemptStatus = "in_progress" | "completed" | "abandoned";

export type UjianAttempt = {
	id: string;
	ujianId: string;
	userId: string;
	startedAt: Date;
	completedAt: Date | null;
	score: string | null; // decimal as string
	totalPoints: number | null;
	status: AttemptStatus;
	createdAt: Date;
};

export type UjianAnswer = {
	id: string;
	attemptId: string;
	questionId: string;
	userAnswer: string | string[];
	isCorrect: boolean | null;
	pointsEarned: number;
	answeredAt: Date;
};

// DTOs for API requests/responses

export type CreateUjianDto = {
	title: string;
	description?: string;
	maxQuestions?: number;
	shuffleQuestions?: boolean;
	shuffleAnswers?: boolean;
	practiceMode?: boolean;
	allowResubmit?: boolean;
};

export type UpdateUjianDto = Partial<CreateUjianDto> & {
	isActive?: boolean;
};

export type CreateQuestionDto = {
	questionText: string;
	questionType: QuestionType;
	options?: QuestionOption[];
	correctAnswer: string | string[];
	points?: number;
	orderIndex: number;
};

export type UpdateQuestionDto = Partial<CreateQuestionDto>;

export type SubmitAnswerDto = {
	questionId: string;
	userAnswer: string | string[];
};

export type AnswerFeedback = {
	questionId: string;
	isCorrect: boolean;
	correctAnswer?: string | string[];
	pointsEarned: number;
};

export type UjianResult = {
	attemptId: string;
	ujianTitle: string;
	score: number;
	totalPoints: number;
	percentage: number;
	completedAt: Date;
	answers: Array<{
		questionId: string;
		questionText: string;
		userAnswer: string | string[];
		correctAnswer: string | string[];
		isCorrect: boolean;
		pointsEarned: number;
		totalPoints: number;
	}>;
};

export type UjianWithQuestions = Ujian & {
	questions: UjianQuestion[];
	totalQuestions: number;
};

export type StartUjianResponse = {
	attemptId: string;
	questions: Array<{
		id: string;
		questionText: string;
		questionType: QuestionType;
		options?: QuestionOption[];
		points: number;
	}>;
};
