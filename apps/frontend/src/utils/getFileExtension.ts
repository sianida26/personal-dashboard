/**
 * Extracts the file extension from a given file path.
 *
 * @param filePath - The full path of the file from which to extract the extension.
 * @returns The file extension as a string if found, otherwise `undefined`.
 *
 * @example
 * ```
 * const extension = getFileExtension("/path/to/your/file.txt");
 * console.log(extension); // Output: "txt"
 * ```
 */
const getFileExtension = (filePath: string): string | undefined => {
	const parts = filePath.split(".");
	if (parts.length > 1) {
		return parts.pop(); // returns the last element which is the extension
	}
	return undefined; // if no extension is found
};

export default getFileExtension;
