/**
 * Parses labels from text using # syntax
 * Labels are defined by # followed by text until end of line
 *
 * @example
 * parseLabels("#perdin ke jakarta\n#test")
 * // Returns: { labels: ["perdin ke jakarta", "test"], cleanedText: "\n" }
 *
 * @param text - The text to parse labels from
 * @returns Object containing parsed labels and cleaned text (without label lines)
 */
export function parseLabels(text: string | null | undefined): {
	labels: string[];
	cleanedText: string;
} {
	if (!text) {
		return { labels: [], cleanedText: "" };
	}

	const lines = text.split("\n");
	const labels: string[] = [];
	const cleanedLines: string[] = [];

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (trimmedLine.startsWith("#")) {
			// Extract label (everything after # until end of line)
			const label = trimmedLine.slice(1).trim();
			if (label) {
				labels.push(label);
			}
		} else {
			cleanedLines.push(line);
		}
	}

	return {
		labels,
		cleanedText: cleanedLines.join("\n").trim(),
	};
}
