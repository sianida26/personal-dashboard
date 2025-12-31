/**
 * Verify CHFI upload
 */
import appLogger from "../utils/logger";
import db from "../drizzle";
import { ujian } from "../drizzle/schema/ujian";
import { ujianQuestions } from "../drizzle/schema/ujianQuestions";
import { eq } from "drizzle-orm";

async function verify() {
	try {
		appLogger.info("Verifying CHFI upload...");

		// Find CHFI ujian
		const chfiUjian = await db
			.select()
			.from(ujian)
			.where(eq(ujian.title, "CHFI Practice Exam"))
			.limit(1);

		if (chfiUjian.length === 0) {
			appLogger.error("❌ CHFI ujian not found!");
			return false;
		}

		appLogger.info(`✅ Found CHFI ujian with ID: ${chfiUjian[0].id}`);
		appLogger.info(`   Title: ${chfiUjian[0].title}`);
		appLogger.info(`   Description: ${chfiUjian[0].description}`);
		appLogger.info(`   Max Questions: ${chfiUjian[0].maxQuestions}`);

		// Count questions
		const questions = await db
			.select()
			.from(ujianQuestions)
			.where(eq(ujianQuestions.ujianId, chfiUjian[0].id));

		appLogger.info(`✅ Found ${questions.length} questions`);

		// Show first 3 questions
		appLogger.info("\nFirst 3 questions:");
		for (let i = 0; i < Math.min(3, questions.length); i++) {
			const q = questions[i];
			appLogger.info(`\n${i + 1}. ${q.questionText}`);
			appLogger.info(`   Type: ${q.questionType}`);
			appLogger.info(`   Options: ${JSON.stringify(q.options)}`);
			appLogger.info(`   Correct: ${JSON.stringify(q.correctAnswer)}`);
		}

		return true;
	} catch (error) {
		appLogger.error("❌ Error verifying CHFI:", error);
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
		appLogger.error("Verification failed:", error);
		process.exit(1);
	});
