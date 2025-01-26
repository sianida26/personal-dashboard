import { writeFile } from "node:fs/promises";

/**
 * Saves a file to the specified path on the filesystem.
 *
 * This function accepts either a `File` object (commonly used in the browser) or a `Buffer`
 * and writes the content to the specified path.
 *
 * @param path - The file system path where the file should be saved.
 * @param file - The file data to be saved. It can be either a `File` object or a `Buffer`.
 * @returns A promise that resolves when the file has been successfully written.
 *
 * @throws If the file writing fails, the promise will be rejected with an error.
 */
const saveFile = async (path: string, file: File | Buffer) => {
	const buffer =
		file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

	await writeFile(path, buffer);
};

export default saveFile;
