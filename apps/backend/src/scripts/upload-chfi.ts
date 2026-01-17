/**
 * Script to upload CHFI questions to the database
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as ujianSchema from "../drizzle/schema/ujian";
import * as ujianQuestionsSchema from "../drizzle/schema/ujianQuestions";

// Simple logger
const logger = {
	info: (msg: string, ...args: any[]) => console.log("[INFO]", msg, ...args),
	error: (msg: string, ...args: any[]) =>
		console.error("[ERROR]", msg, ...args),
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

type CHFIQuestion = {
	question: string;
	options: Array<{
		value: string;
		isCorrect: boolean;
	}>;
};

async function uploadCHFI() {
	try {
		logger.info("Starting CHFI upload process...");

		// Read the CHFI JSON file
		const chfiPath = resolve(__dirname, "../../chfi.json");
		const chfiData: CHFIQuestion[] = JSON.parse(
			readFileSync(chfiPath, "utf-8"),
		);

		logger.info(`Found ${chfiData.length} questions in chfi.json`);

		// Filter out empty questions
		const validQuestions = chfiData.filter(
			(q) => q.question && q.options && q.options.length > 0,
		);
		logger.info(`${validQuestions.length} valid questions found`);

		// Create the ujian entry
		logger.info("Creating CHFI ujian entry...");
		const [insertedUjian] = await db
			.insert(ujian)
			.values({
				title: "CHFI Practice Exam",
				description:
					"Computer Hacking Forensic Investigator (CHFI) practice questions",
				maxQuestions: validQuestions.length,
				shuffleQuestions: true,
				shuffleAnswers: true,
				practiceMode: true,
				allowResubmit: true,
				isActive: true,
			})
			.returning()
			.catch((err) => {
				logger.error("Database insert error:", err);
				throw err;
			});
		if (!insertedUjian) {
			throw new Error("Failed to create ujian entry");
		}
		logger.info(`Created ujian with ID: ${insertedUjian.id}`);

		// Prepare questions data
		const questionsData = validQuestions.map((q, index) => {
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

		for (let i = 0; i < questionsData.length; i += batchSize) {
			const batch = questionsData.slice(i, i + batchSize);
			await db.insert(ujianQuestions).values(batch);
			insertedCount += batch.length;
			logger.info(
				`Inserted ${insertedCount}/${questionsData.length} questions`,
			);
		}

		logger.info("✅ CHFI upload completed successfully!");
		logger.info(`Total questions inserted: ${insertedCount}`);
		logger.info(`Ujian ID: ${insertedUjian.id}`);

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
		throw error;
	}
}

// Run the upload if this script is executed directly
if (require.main === module) {
	uploadCHFI()
		.then(async () => {
			logger.info("Upload process completed");
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

export default uploadCHFI;
