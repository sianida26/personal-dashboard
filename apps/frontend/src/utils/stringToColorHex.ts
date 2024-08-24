/**
 * Generates a consistent hex color code from a given string.
 *
 * The function uses a hash algorithm to convert the input string into a number,
 * which is then converted into a hexadecimal color code. The same input string
 * will always produce the same color hex code.
 *
 * @param inputString - The input string from which the color is generated.
 * @returns The generated hex color code.
 */
export default function stringToColorHex(inputString: string): string {
	// Hash function to convert string to number
	let hash = 0;
	for (let i = 0; i < inputString.length; i++) {
		hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
	}

	// Convert the number to a hex color code
	let color = "#";
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xff;
		color += ("00" + value.toString(16)).substr(-2);
	}

	return color;
}
