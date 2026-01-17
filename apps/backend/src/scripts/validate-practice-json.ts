/**
 * Script to validate practice question JSON files before upload
 *
 * Usage:
 *   bun run src/scripts/validate-practice-json.ts <json-file-path>
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Question = {
	question: string;
	options: Array<{
		value: string;
		isCorrect: boolean;
	}>;
};

const logger = {
	info: (msg: string) => console.log(`ℹ️  ${msg}`),
	error: (msg: string) => console.log(`❌ ${msg}`),
	warn: (msg: string) => console.log(`⚠️  ${msg}`),
	success: (msg: string) => console.log(`✅ ${msg}`),
};

function validateJSON(filePath: string) {
	try {
		const absolutePath = resolve(process.cwd(), filePath);
		logger.info(`Validating file: ${absolutePath}`);
		console.log("");

		// Read and parse JSON
		let data: Question[];
		try {
			const content = readFileSync(absolutePath, "utf-8");
			data = JSON.parse(content);
		} catch (error) {
			logger.error("Failed to read or parse JSON file");
			if (error instanceof Error) {
				logger.error(error.message);
			}
			return false;
		}

		// Check if it's an array
		if (!Array.isArray(data)) {
			logger.error("JSON must be an array of questions");
			return false;
		}

		logger.info(`Total items in array: ${data.length}`);
		console.log("");

		let validCount = 0;
		let invalidCount = 0;
		const issues: string[] = [];

		// Validate each question
		data.forEach((item, index) => {
			const questionNum = index + 1;
			let isValid = true;

			// Check question field
			if (!item.question || typeof item.question !== "string") {
				issues.push(
					`Question ${questionNum}: Missing or invalid 'question' field`,
				);
				isValid = false;
			} else if (item.question.trim().length === 0) {
				issues.push(`Question ${questionNum}: Empty question text`);
				isValid = false;
			}

			// Check options field
			if (!item.options || !Array.isArray(item.options)) {
				issues.push(
					`Question ${questionNum}: Missing or invalid 'options' field`,
				);
				isValid = false;
			} else {
				if (item.options.length === 0) {
					issues.push(`Question ${questionNum}: No options provided`);
					isValid = false;
				} else if (item.options.length < 2) {
					issues.push(
						`Question ${questionNum}: Should have at least 2 options`,
					);
				}

				// Validate each option
				let hasCorrect = false;
				let correctCount = 0;
				item.options.forEach((opt, optIndex) => {
					if (!opt.value || typeof opt.value !== "string") {
						issues.push(
							`Question ${questionNum}, Option ${optIndex + 1}: Missing or invalid 'value'`,
						);
						isValid = false;
					}
					if (typeof opt.isCorrect !== "boolean") {
						issues.push(
							`Question ${questionNum}, Option ${optIndex + 1}: Missing or invalid 'isCorrect' (must be boolean)`,
						);
						isValid = false;
					}
					if (opt.isCorrect) {
						hasCorrect = true;
						correctCount++;
					}
				});

				if (!hasCorrect) {
					issues.push(
						`Question ${questionNum}: No correct answer marked (at least one option must have isCorrect: true)`,
					);
					isValid = false;
				}

				if (correctCount > 1) {
					logger.warn(
						`Question ${questionNum}: Multiple correct answers (${correctCount}). This is allowed but uncommon for MCQ.`,
					);
				}
			}

			if (isValid) {
				validCount++;
			} else {
				invalidCount++;
			}
		});

		// Display results
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("📊 Validation Results");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`Total Questions: ${data.length}`);
		console.log(`Valid Questions: ${validCount} ✅`);
		console.log(`Invalid Questions: ${invalidCount} ❌`);
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("");

		if (issues.length > 0) {
			console.log("⚠️  Issues Found:");
			console.log("");
			issues.forEach((issue) => {
				console.log(`  • ${issue}`);
			});
			console.log("");
		}

		if (invalidCount === 0) {
			logger.success("All questions are valid! ✨");
			logger.info("This file is ready to upload.");
			return true;
		}
		logger.error(`Found ${invalidCount} invalid question(s)`);
		logger.info("Please fix the issues before uploading.");
		return false;
	} catch (error) {
		logger.error("Validation failed");
		if (error instanceof Error) {
			logger.error(error.message);
		}
		return false;
	}
}

// Run validation if executed directly
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		logger.error(
			"Usage: bun run src/scripts/validate-practice-json.ts <json-file-path>",
		);
		logger.info(
			"Example: bun run src/scripts/validate-practice-json.ts ../../scratch/chfi/practice/module1.json",
		);
		process.exit(1);
	}

	const isValid = validateJSON(args[0]);
	process.exit(isValid ? 0 : 1);
}

export default validateJSON;
