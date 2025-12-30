import appLogger from "../../utils/logger";
import db from "..";
import { ujian } from "../schema/ujian";
import { ujianQuestions } from "../schema/ujianQuestions";

const ujianSeeder = async () => {
	appLogger.info("Seeding ujian...");

	const ujianData: (typeof ujian.$inferInsert)[] = [
		{
			title: "Ujian Matematika Dasar",
			description: "Ujian matematika dasar untuk kelas 10",
			maxQuestions: 10,
			practiceMode: false,
			allowResubmit: false,
			isActive: true,
		},
		{
			title: "Latihan Bahasa Indonesia",
			description: "Latihan soal bahasa Indonesia - dapat diulang",
			maxQuestions: 5,
			practiceMode: true,
			allowResubmit: true,
			isActive: true,
		},
		{
			title: "Quiz IPA",
			description: "Quiz singkat tentang IPA",
			maxQuestions: 15,
			practiceMode: false,
			allowResubmit: true,
			isActive: true,
		},
	];

	// Insert ujian
	const insertedUjian = await db
		.insert(ujian)
		.values(ujianData)
		.onConflictDoNothing()
		.returning();

	appLogger.info(`${insertedUjian.length} new ujian inserted`);

	// Create questions for each ujian
	const questionsData: (typeof ujianQuestions.$inferInsert)[] = [];

	// Questions for Matematika Dasar
	if (insertedUjian[0]) {
		questionsData.push(
			{
				ujianId: insertedUjian[0].id,
				questionText: "Berapa hasil dari 5 + 7?",
				questionType: "mcq",
				options: [
					{ id: "1", text: "10" },
					{ id: "2", text: "12" },
					{ id: "3", text: "15" },
					{ id: "4", text: "13" },
				],
				correctAnswer: ["2"],
				points: 10,
				orderIndex: 1,
			},
			{
				ujianId: insertedUjian[0].id,
				questionText: "Berapa hasil dari 9 × 8?",
				questionType: "mcq",
				options: [
					{ id: "1", text: "72" },
					{ id: "2", text: "81" },
					{ id: "3", text: "64" },
					{ id: "4", text: "56" },
				],
				correctAnswer: ["1"],
				points: 10,
				orderIndex: 2,
			},
			{
				ujianId: insertedUjian[0].id,
				questionText: "Jika x + 5 = 12, berapa nilai x?",
				questionType: "input",
				options: null,
				correctAnswer: ["7"],
				points: 15,
				orderIndex: 3,
			},
			{
				ujianId: insertedUjian[0].id,
				questionText: "Pilih bilangan prima: (pilih semua yang benar)",
				questionType: "multiple_select",
				options: [
					{ id: "1", text: "2" },
					{ id: "2", text: "4" },
					{ id: "3", text: "7" },
					{ id: "4", text: "9" },
					{ id: "5", text: "11" },
				],
				correctAnswer: ["1", "3", "5"],
				points: 20,
				orderIndex: 4,
			},
		);
	}

	// Questions for Bahasa Indonesia
	if (insertedUjian[1]) {
		questionsData.push(
			{
				ujianId: insertedUjian[1].id,
				questionText: "Apa ibu kota Indonesia?",
				questionType: "mcq",
				options: [
					{ id: "1", text: "Bandung" },
					{ id: "2", text: "Jakarta" },
					{ id: "3", text: "Surabaya" },
					{ id: "4", text: "Medan" },
				],
				correctAnswer: ["2"],
				points: 10,
				orderIndex: 1,
			},
			{
				ujianId: insertedUjian[1].id,
				questionText:
					"Kata baku yang benar adalah... (pilih semua yang benar)",
				questionType: "multiple_select",
				options: [
					{ id: "1", text: "Apotek" },
					{ id: "2", text: "Apotik" },
					{ id: "3", text: "Sistem" },
					{ id: "4", text: "Sistim" },
				],
				correctAnswer: ["1", "3"],
				points: 15,
				orderIndex: 2,
			},
			{
				ujianId: insertedUjian[1].id,
				questionText: "Sebutkan salah satu contoh kata majemuk:",
				questionType: "input",
				options: null,
				correctAnswer: ["rumah sakit", "kamar mandi", "meja tulis"],
				points: 10,
				orderIndex: 3,
			},
		);
	}

	// Questions for Quiz IPA
	if (insertedUjian[2]) {
		questionsData.push(
			{
				ujianId: insertedUjian[2].id,
				questionText: "Planet terbesar di tata surya adalah?",
				questionType: "mcq",
				options: [
					{ id: "1", text: "Mars" },
					{ id: "2", text: "Jupiter" },
					{ id: "3", text: "Saturnus" },
					{ id: "4", text: "Bumi" },
				],
				correctAnswer: ["2"],
				points: 5,
				orderIndex: 1,
			},
			{
				ujianId: insertedUjian[2].id,
				questionText: "H2O adalah rumus kimia untuk?",
				questionType: "mcq",
				options: [
					{ id: "1", text: "Oksigen" },
					{ id: "2", text: "Hidrogen" },
					{ id: "3", text: "Air" },
					{ id: "4", text: "Karbon Dioksida" },
				],
				correctAnswer: ["3"],
				points: 5,
				orderIndex: 2,
			},
			{
				ujianId: insertedUjian[2].id,
				questionText: "Berapa jumlah kromosom manusia normal?",
				questionType: "input",
				options: null,
				correctAnswer: ["46"],
				points: 10,
				orderIndex: 3,
			},
		);
	}

	// Insert questions
	if (questionsData.length > 0) {
		const insertedQuestions = await db
			.insert(ujianQuestions)
			.values(questionsData)
			.onConflictDoNothing()
			.returning();

		appLogger.info(`${insertedQuestions.length} new questions inserted`);
	}
};

export default ujianSeeder;
