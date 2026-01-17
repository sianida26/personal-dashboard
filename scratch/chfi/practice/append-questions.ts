#!/usr/bin/env bun

/**
 * Script to append questions to module3 JSON file
 * Usage: bun run append-questions.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface Option {
	value: string;
	isCorrect: boolean;
}

interface Question {
	question: string;
	options: Option[];
}

const MODULE_FILE = join(__dirname, "module3-hard-disks-file-systems.json");

function loadQuestions(): Question[] {
	try {
		const content = readFileSync(MODULE_FILE, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.error("Error loading questions:", error);
		return [];
	}
}

function saveQuestions(questions: Question[]): void {
	try {
		writeFileSync(MODULE_FILE, JSON.stringify(questions, null, 2), "utf-8");
		console.log(`✅ Saved ${questions.length} questions to ${MODULE_FILE}`);
	} catch (error) {
		console.error("Error saving questions:", error);
	}
}

function appendQuestions(newQuestions: Question[]): void {
	const existingQuestions = loadQuestions();
	const allQuestions = [...existingQuestions, ...newQuestions];
	saveQuestions(allQuestions);
	console.log(
		`📝 Added ${newQuestions.length} new questions (Total: ${allQuestions.length})`,
	);
}

// Export for use in other scripts
export { appendQuestions, loadQuestions, saveQuestions };

// If run directly, show usage
if (import.meta.main) {
	console.log("📚 Question Appender Utility");
	console.log(
		"This is a utility module. Import and use appendQuestions() to add questions.",
	);
	console.log(`Current questions: ${loadQuestions().length}`);
}
