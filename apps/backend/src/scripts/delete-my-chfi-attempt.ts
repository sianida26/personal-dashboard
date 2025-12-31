/**
 * Script to delete user's CHFI attempt
 * This will remove the attempt and all associated answers
 */

import { eq, and } from "drizzle-orm";
import db from "../drizzle";
import { ujian } from "../drizzle/schema/ujian";
import { ujianAttempts } from "../drizzle/schema/ujianAttempts";
import { ujianAnswers } from "../drizzle/schema/ujianAnswers";

const CHFI_UJIAN_ID = "ys7haw61nup01hegy1sux8dg";

async function deleteMyChfiAttempt() {
	try {
		console.log("🔍 Finding CHFI ujian...");
		
		// Find the CHFI ujian
		const chfiUjian = await db.query.ujian.findFirst({
			where: eq(ujian.id, CHFI_UJIAN_ID),
		});

		if (!chfiUjian) {
			console.log("❌ CHFI ujian not found!");
			return;
		}

		console.log(`✅ Found CHFI ujian: ${chfiUjian.title}`);
		console.log(`📝 Ujian ID: ${chfiUjian.id}`);

		console.log(`\n🔍 Finding ALL attempts for this ujian...`);

		// Find all attempts for this ujian (from all users)
		const attempts = await db.query.ujianAttempts.findMany({
			where: eq(ujianAttempts.ujianId, CHFI_UJIAN_ID),
			with: {
				answers: true,
			},
		});

		if (attempts.length === 0) {
			console.log("ℹ️  No attempts found for this ujian");
			return;
		}

		console.log(`\n📊 Found ${attempts.length} attempt(s):`);
		
		for (const attempt of attempts) {
			console.log(`\n  Attempt ID: ${attempt.id}`);
			console.log(`  User ID: ${attempt.userId}`);
			console.log(`  Status: ${attempt.status}`);
			console.log(`  Answers: ${attempt.answers.length}`);
			console.log(`  Score: ${attempt.score ?? "N/A"}`);
			console.log(`  Started: ${attempt.startedAt}`);
			console.log(`  Completed: ${attempt.completedAt ?? "N/A"}`);
		}

		console.log("\n🗑️  Deleting all answers...");
		
		for (const attempt of attempts) {
			if (attempt.answers.length > 0) {
				await db.delete(ujianAnswers).where(
					eq(ujianAnswers.attemptId, attempt.id)
				);
				console.log(`  ✅ Deleted ${attempt.answers.length} answers for attempt ${attempt.id}`);
			}
		}

		console.log("\n🗑️  Deleting attempts...");
		
		const deletedAttempts = await db.delete(ujianAttempts).where(
			eq(ujianAttempts.ujianId, CHFI_UJIAN_ID)
		).returning();

		console.log(`\n✅ Successfully deleted ${deletedAttempts.length} attempt(s)!`);
		console.log("\n🎉 You can now start a fresh CHFI exam attempt!");

	} catch (error) {
		console.error("❌ Error deleting attempt:", error);
		throw error;
	}
}

// Run the script
deleteMyChfiAttempt()
	.then(() => {
		console.log("\n✨ Script completed successfully!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Script failed:", error);
		process.exit(1);
	});
