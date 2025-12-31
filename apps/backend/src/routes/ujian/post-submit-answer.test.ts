import { describe, it, expect } from "bun:test";

/**
 * Checks if the user's answer is correct based on question type
 */
const checkAnswer = (
	questionType: "mcq" | "multiple_select" | "input",
	userAnswer: string | string[],
	correctAnswer: string | string[],
): boolean => {
	switch (questionType) {
		case "mcq":
			// MCQ: userAnswer is a string, correctAnswer is an array with single element
			if (Array.isArray(correctAnswer) && correctAnswer.length === 1) {
				return userAnswer === correctAnswer[0];
			}
			return userAnswer === correctAnswer;

		case "multiple_select":
			if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
				return false;
			}
			const sortedUser = [...userAnswer].sort();
			const sortedCorrect = [...correctAnswer].sort();
			return (
				sortedUser.length === sortedCorrect.length &&
				sortedUser.every((val, idx) => val === sortedCorrect[idx])
			);

		case "input":
			// Input: userAnswer is a string, correctAnswer could be array or string
			// Case-insensitive string comparison for input type
			const userStr = String(userAnswer).toLowerCase().trim();
			let correctStr: string;
			if (Array.isArray(correctAnswer) && correctAnswer.length > 0) {
				correctStr = String(correctAnswer[0]).toLowerCase().trim();
			} else {
				correctStr = String(correctAnswer).toLowerCase().trim();
			}
			return userStr === correctStr;

		default:
			return false;
	}
};

describe("checkAnswer function", () => {
	describe("MCQ type", () => {
		it("should return true when user answer matches correct answer (array format)", () => {
			const result = checkAnswer("mcq", "1", ["1"]);
			expect(result).toBe(true);
		});

		it("should return false when user answer doesn't match correct answer (array format)", () => {
			const result = checkAnswer("mcq", "2", ["1"]);
			expect(result).toBe(false);
		});

		it("should handle string format for backward compatibility", () => {
			const result = checkAnswer("mcq", "1", "1");
			expect(result).toBe(true);
		});
	});

	describe("Multiple select type", () => {
		it("should return true when arrays match (different order)", () => {
			const result = checkAnswer("multiple_select", ["1", "3", "5"], ["5", "1", "3"]);
			expect(result).toBe(true);
		});

		it("should return false when arrays have different elements", () => {
			const result = checkAnswer("multiple_select", ["1", "2"], ["1", "3"]);
			expect(result).toBe(false);
		});

		it("should return false when arrays have different length", () => {
			const result = checkAnswer("multiple_select", ["1", "2"], ["1"]);
			expect(result).toBe(false);
		});
	});

	describe("Input type", () => {
		it("should return true for matching strings (case insensitive)", () => {
			const result = checkAnswer("input", "Linux", ["linux"]);
			expect(result).toBe(true);
		});

		it("should trim whitespace", () => {
			const result = checkAnswer("input", "  Linux  ", ["linux"]);
			expect(result).toBe(true);
		});

		it("should handle string format for backward compatibility", () => {
			const result = checkAnswer("input", "linux", "Linux");
			expect(result).toBe(true);
		});

		it("should return false for non-matching strings", () => {
			const result = checkAnswer("input", "Windows", ["Linux"]);
			expect(result).toBe(false);
		});
	});

	// Real CHFI examples
	describe("Real CHFI test cases", () => {
		it("Question 1: lsmod should be correct", () => {
			// User clicks option 1 (lsmod), correct answer is ["1"]
			const result = checkAnswer("mcq", "1", ["1"]);
			expect(result).toBe(true);
		});

		it("Question 2: Static should be correct", () => {
			// User clicks option 2 (Static), correct answer is ["2"]
			const result = checkAnswer("mcq", "2", ["2"]);
			expect(result).toBe(true);
		});

		it("Question 3: Cross-site scripting should be correct", () => {
			// User clicks option 1, correct answer is ["1"]
			const result = checkAnswer("mcq", "1", ["1"]);
			expect(result).toBe(true);
		});

		it("Question with multiple correct answers", () => {
			// User selects options 1, 3, 5 for prime numbers question
			const result = checkAnswer("multiple_select", ["1", "3", "5"], ["1", "3", "5"]);
			expect(result).toBe(true);
		});
	});
});
