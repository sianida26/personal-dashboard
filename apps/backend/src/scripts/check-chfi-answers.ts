/**
 * Check CHFI answers in database
 */
import appLogger from "../utils/logger";
import db from "../drizzle";
import { ujian } from "../drizzle/schema/ujian";
import { ujianQuestions } from "../drizzle/schema/ujianQuestions";
import { eq } from "drizzle-orm";

async function checkAnswers() {
	try {
		appLogger.info("Checking CHFI answers in database...");

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

		// Get first 10 questions to check
		const questions = await db
			.select()
			.from(ujianQuestions)
			.where(eq(ujianQuestions.ujianId, chfiUjian[0].id))
			.limit(10);

		appLogger.info(`\nChecking first 10 questions:\n`);

		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			appLogger.info(`\n${i + 1}. ${q.questionText}`);
			appLogger.info(`   Question Type: ${q.questionType}`);
			
			if (q.options) {
				appLogger.info(`   Options:`);
				const options = q.options as Array<{ id: string; text: string }>;
				options.forEach((opt) => {
					appLogger.info(`      ${opt.id}. ${opt.text}`);
				});
			}
			
			appLogger.info(`   Correct Answer: ${JSON.stringify(q.correctAnswer)}`);
			appLogger.info(`   Points: ${q.points}`);
		}

		return true;
	} catch (error) {
		appLogger.error("❌ Error checking answers:", error);
		return false;
	}
}

checkAnswers()
	.then((success) => {
		if (success) {
			appLogger.info("\n✅ Check completed!");
		}
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		appLogger.error("Check failed:", error);
		process.exit(1);
	});
