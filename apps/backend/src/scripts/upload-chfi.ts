/**
 * Script to upload CHFI questions to the database
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import db from "../drizzle";
import { ujian } from "../drizzle/schema/ujian";
import { ujianQuestions } from "../drizzle/schema/ujianQuestions";
import appLogger from "../utils/logger";

type CHFIQuestion = {
	question: string;
	options: Array<{
		value: string;
		isCorrect: boolean;
	}>;
};

async function uploadCHFI() {
	try {
		appLogger.info("Starting CHFI upload process...");

		// Read the CHFI JSON file
		const chfiPath = resolve(__dirname, "../../chfi.json");
		const chfiData: CHFIQuestion[] = JSON.parse(
			readFileSync(chfiPath, "utf-8"),
		);

		appLogger.info(`Found ${chfiData.length} questions in chfi.json`);

		// Filter out empty questions
		const validQuestions = chfiData.filter(
			(q) => q.question && q.options && q.options.length > 0,
		);
		appLogger.info(`${validQuestions.length} valid questions found`);

		// Create the ujian entry
		appLogger.info("Creating CHFI ujian entry...");
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
			.returning();
		if (!insertedUjian) {
			throw new Error("Failed to create ujian entry");
		}
		appLogger.info(`Created ujian with ID: ${insertedUjian.id}`);

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
			appLogger.info(
				`Inserted ${insertedCount}/${questionsData.length} questions`,
			);
		}

		appLogger.info("✅ CHFI upload completed successfully!");
		appLogger.info(`Total questions inserted: ${insertedCount}`);
		appLogger.info(`Ujian ID: ${insertedUjian.id}`);

		return {
			success: true,
			ujianId: insertedUjian.id,
			questionsCount: insertedCount,
		};
	} catch (error) {
		appLogger.error(
			error instanceof Error ? error : new Error(String(error)),
		);
		throw error;
	}
}

// Run the upload if this script is executed directly
if (require.main === module) {
	uploadCHFI()
		.then(() => {
			appLogger.info("Upload process completed");
			process.exit(0);
		})
		.catch((error) => {
			appLogger.error(
				error instanceof Error ? error : new Error(String(error)),
			);
			process.exit(1);
		});
}

export default uploadCHFI;
