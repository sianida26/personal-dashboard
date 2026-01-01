/**
 * Verify CHFI upload
 */

import { eq } from "drizzle-orm";
import db from "../drizzle";
import { ujian } from "../drizzle/schema/ujian";
import { ujianQuestions } from "../drizzle/schema/ujianQuestions";
import appLogger from "../utils/logger";

async function verify() {
	try {
		appLogger.info("Verifying CHFI upload...");

		// Find CHFI ujian
		const chfiUjian = await db
			.select()
			.from(ujian)
			.where(eq(ujian.title, "CHFI Practice Exam"))
			.limit(1);

		const chfiUjianResult = chfiUjian[0];
		if (!chfiUjianResult) {
			appLogger.error(new Error("❌ CHFI ujian not found!"));
			return false;
		}

		appLogger.info(`✅ Found CHFI ujian with ID: ${chfiUjianResult.id}`);
		appLogger.info(`   Title: ${chfiUjianResult.title}`);
		appLogger.info(`   Description: ${chfiUjianResult.description}`);
		appLogger.info(`   Max Questions: ${chfiUjianResult.maxQuestions}`);

		// Count questions
		const questions = await db
			.select()
			.from(ujianQuestions)
			.where(eq(ujianQuestions.ujianId, chfiUjianResult.id));

		appLogger.info(`✅ Found ${questions.length} questions`);

		// Show first 3 questions
		appLogger.info("\nFirst 3 questions:");
		const first3Questions = questions.slice(0, 3);
		for (const [i, q] of first3Questions.entries()) {
			if (!q) continue;
			appLogger.info(`\n${i + 1}. ${q.questionText}`);
			appLogger.info(`   Type: ${q.questionType}`);
			appLogger.info(`   Options: ${JSON.stringify(q.options)}`);
			appLogger.info(`   Correct: ${JSON.stringify(q.correctAnswer)}`);
		}

		return true;
	} catch (error) {
		appLogger.error(
			error instanceof Error ? error : new Error(String(error)),
		);
		return false;
	}
}

verify()
	.then((success) => {
		if (success) {
			appLogger.info("\n✅ Verification completed successfully!");
		}
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		appLogger.error(
			error instanceof Error ? error : new Error(String(error)),
		);
		process.exit(1);
	});
