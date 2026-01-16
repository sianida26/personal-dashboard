import { describe, expect, it } from "bun:test";
import { parseLabels } from "../../src/utils/parse-labels";

describe("parseLabels", () => {
	it("should parse single label from text", () => {
		const text = "#perdin ke jakarta";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["perdin ke jakarta"]);
		expect(result.cleanedText).toBe("");
	});

	it("should parse multiple labels from text", () => {
		const text = "#perdin ke jakarta\n#test";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["perdin ke jakarta", "test"]);
		expect(result.cleanedText).toBe("");
	});

	it("should parse labels with spaces correctly", () => {
		const text = "#meeting with client\n#urgent task";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["meeting with client", "urgent task"]);
		expect(result.cleanedText).toBe("");
	});

	it("should keep non-label text in cleanedText", () => {
		const text = "Some description\n#label1\nMore text\n#label2";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["label1", "label2"]);
		expect(result.cleanedText).toBe("Some description\nMore text");
	});

	it("should handle empty text", () => {
		const result = parseLabels("");

		expect(result.labels).toEqual([]);
		expect(result.cleanedText).toBe("");
	});

	it("should handle null text", () => {
		const result = parseLabels(null);

		expect(result.labels).toEqual([]);
		expect(result.cleanedText).toBe("");
	});

	it("should handle undefined text", () => {
		const result = parseLabels(undefined);

		expect(result.labels).toEqual([]);
		expect(result.cleanedText).toBe("");
	});

	it("should ignore # in the middle of a line", () => {
		const text = "This is a # test\nThis is #another test";
		const result = parseLabels(text);

		expect(result.labels).toEqual([]);
		expect(result.cleanedText).toBe(
			"This is a # test\nThis is #another test",
		);
	});

	it("should handle labels with only # and no text", () => {
		const text = "#\n#label1";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["label1"]);
		expect(result.cleanedText).toBe("");
	});

	it("should trim whitespace from labels", () => {
		const text = "#  label with spaces  \n#another";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["label with spaces", "another"]);
		expect(result.cleanedText).toBe("");
	});

	it("should handle mixed content with labels at different positions", () => {
		const text =
			"Description line 1\n#label1\nDescription line 2\n#label2\nDescription line 3";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["label1", "label2"]);
		expect(result.cleanedText).toBe(
			"Description line 1\nDescription line 2\nDescription line 3",
		);
	});

	it("should handle labels with special characters", () => {
		const text = "#project-2024\n#client@company";
		const result = parseLabels(text);

		expect(result.labels).toEqual(["project-2024", "client@company"]);
		expect(result.cleanedText).toBe("");
	});
});
