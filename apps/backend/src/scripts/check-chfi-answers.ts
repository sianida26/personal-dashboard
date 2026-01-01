/**
 * Check CHFI answers in database
 */

import { eq } from "drizzle-orm";
import db from "../drizzle";
import { ujian } from "../drizzle/schema/ujian";
import { ujianQuestions } from "../drizzle/schema/ujianQuestions";
import appLogger from "../utils/logger";

async function checkAnswers() {
	try {
		appLogger.info("Checking CHFI answers in database...");

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

		// Get first 10 questions to check
		const questions = await db
			.select()
			.from(ujianQuestions)
			.where(eq(ujianQuestions.ujianId, chfiUjianResult.id))
			.limit(10);

		appLogger.info("\nChecking first 10 questions:\n");

		for (const [i, q] of questions.entries()) {
			if (!q) continue;
			appLogger.info(`\n${i + 1}. ${q.questionText}`);
			appLogger.info(`   Question Type: ${q.questionType}`);

			if (q.options) {
				appLogger.info("   Options:");
				const options = q.options as Array<{
					id: string;
					text: string;
				}>;
				for (const opt of options) {
					appLogger.info(`      ${opt.id}. ${opt.text}`);
				}
			}

			appLogger.info(
				`   Correct Answer: ${JSON.stringify(q.correctAnswer)}`,
			);
			appLogger.info(`   Points: ${q.points}`);
		}

		return true;
	} catch (error) {
		appLogger.error(
			error instanceof Error ? error : new Error(String(error)),
		);
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
		appLogger.error(
			error instanceof Error ? error : new Error(String(error)),
		);
		process.exit(1);
	});
