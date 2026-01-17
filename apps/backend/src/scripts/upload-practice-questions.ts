/**
 * Script to upload practice exam questions to the database
 *
 * Usage:
 *   bun run src/scripts/upload-practice-questions.ts <json-file-path> <exam-title> [exam-description]
 *
 * Example:
 *   bun run src/scripts/upload-practice-questions.ts ../../scratch/chfi/practice/module1-computer-forensics-in-todays-world.json "CHFI Module 1: Computer Forensics in Today's World"
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as ujianSchema from "../drizzle/schema/ujian";
import * as ujianQuestionsSchema from "../drizzle/schema/ujianQuestions";

// Load .env file
config();

// Simple logger
const logger = {
	info: (msg: string, ...args: any[]) => console.log("[INFO]", msg, ...args),
	error: (msg: string, ...args: any[]) =>
		console.error("[ERROR]", msg, ...args),
	warn: (msg: string, ...args: any[]) => console.warn("[WARN]", msg, ...args),
};

// Use REMOTE_DB_URL from environment
const REMOTE_DB_URL = process.env.REMOTE_DB_URL || process.env.DATABASE_URL;
if (!REMOTE_DB_URL) {
	throw new Error("REMOTE_DB_URL or DATABASE_URL is required");
}

logger.info(
	`Connecting to database: ${REMOTE_DB_URL.replace(/:[^:@]+@/, ":***@")}`,
);

const sql = postgres(REMOTE_DB_URL);
const db = drizzle({
	client: sql,
	schema: {
		...ujianSchema,
		...ujianQuestionsSchema,
	},
});

const { ujian } = ujianSchema;
const { ujianQuestions } = ujianQuestionsSchema;

type Question = {
	question: string;
	options: Array<{
		value: string;
		isCorrect: boolean;
	}>;
};

async function uploadPracticeQuestions(
	jsonFilePath: string,
	examTitle: string,
	examDescription?: string,
) {
	try {
		logger.info("Starting practice questions upload process...");
		logger.info(`File: ${jsonFilePath}`);
		logger.info(`Title: ${examTitle}`);

		// Read the JSON file
		const absolutePath = resolve(process.cwd(), jsonFilePath);
		logger.info(`Reading file from: ${absolutePath}`);

		const questionsData: Question[] = JSON.parse(
			readFileSync(absolutePath, "utf-8"),
		);

		logger.info(`Found ${questionsData.length} questions in JSON file`);

		// Validate questions
		const validQuestions = questionsData.filter((q) => {
			if (!q.question || !q.options || q.options.length === 0) {
				logger.warn(
					`Skipping invalid question: ${q.question?.substring(0, 50) || "No question text"}`,
				);
				return false;
			}

			// Check if there's at least one correct answer
			const hasCorrect = q.options.some((opt) => opt.isCorrect);
			if (!hasCorrect) {
				logger.warn(
					`Skipping question without correct answer: ${q.question.substring(0, 50)}`,
				);
				return false;
			}

			return true;
		});

		logger.info(`${validQuestions.length} valid questions found`);

		if (validQuestions.length === 0) {
			throw new Error("No valid questions found in the JSON file");
		}

		// Create the ujian entry
		logger.info("Creating exam entry...");
		const [insertedUjian] = await db
			.insert(ujian)
			.values({
				title: examTitle,
				description: examDescription || `Practice exam: ${examTitle}`,
				maxQuestions: validQuestions.length,
				shuffleQuestions: true,
				shuffleAnswers: true,
				practiceMode: true, // This is a practice mode exam
				allowResubmit: true,
				isActive: true,
			})
			.returning()
			.catch((err) => {
				logger.error("Database insert error:", err);
				throw err;
			});

		if (!insertedUjian) {
			throw new Error("Failed to create exam entry");
		}
		logger.info(`✅ Created exam with ID: ${insertedUjian.id}`);

		// Prepare questions data
		const preparedQuestions = validQuestions.map((q, index) => {
			// Create options with ids
			const options = q.options.map((opt, optIndex) => ({
				id: (optIndex + 1).toString(),
				text: opt.value,
			}));

			// Find correct answer(s)
			const correctAnswer = q.options
				.map((opt, optIndex) =>
					opt.isCorrect ? (optIndex + 1).toString() : null,
				)
				.filter((id): id is string => id !== null);

			return {
				ujianId: insertedUjian.id,
				questionText: q.question,
				questionType: "mcq" as const,
				options,
				correctAnswer,
				points: 1,
				orderIndex: index + 1,
			};
		});

		// Insert questions in batches to avoid overwhelming the database
		const batchSize = 50;
		let insertedCount = 0;

		logger.info("Inserting questions in batches...");
		for (let i = 0; i < preparedQuestions.length; i += batchSize) {
			const batch = preparedQuestions.slice(i, i + batchSize);
			await db.insert(ujianQuestions).values(batch);
			insertedCount += batch.length;
			logger.info(
				`  Progress: ${insertedCount}/${preparedQuestions.length} questions inserted`,
			);
		}

		logger.info("\n✅ Upload completed successfully!");
		logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		logger.info(`📋 Exam Title: ${examTitle}`);
		logger.info(`🆔 Exam ID: ${insertedUjian.id}`);
		logger.info(`📝 Total Questions: ${insertedCount}`);
		logger.info("🎯 Practice Mode: Enabled");
		logger.info("🔄 Resubmit: Allowed");
		logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		return {
			success: true,
			ujianId: insertedUjian.id,
			questionsCount: insertedCount,
		};
	} catch (error) {
		logger.error(
			"Upload failed:",
			error instanceof Error ? error.message : String(error),
		);
		if (error instanceof Error && error.stack) {
			logger.error("Stack trace:", error.stack);
		}
		throw error;
	}
}

// Run the upload if this script is executed directly
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		logger.error(
			"Usage: bun run src/scripts/upload-practice-questions.ts <json-file-path> <exam-title> [exam-description]",
		);
		logger.error("\nExample:");
		logger.error(
			'  bun run src/scripts/upload-practice-questions.ts ../../scratch/chfi/practice/module1.json "CHFI Module 1" "Practice questions for Module 1"',
		);
		process.exit(1);
	}

	const [jsonFilePath, examTitle, examDescription] = args;

	uploadPracticeQuestions(jsonFilePath, examTitle, examDescription)
		.then(async () => {
			logger.info("Upload process completed successfully");
			await sql.end();
			process.exit(0);
		})
		.catch(async (error) => {
			logger.error(
				"Upload failed:",
				error instanceof Error ? error.message : String(error),
			);
			await sql.end();
			process.exit(1);
		});
}

export default uploadPracticeQuestions;
