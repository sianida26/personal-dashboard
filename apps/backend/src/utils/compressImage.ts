import sharp from "sharp";

/**
 * Options for compressing an image
 * @property inputFile - The input file to compress
 * @property outputPath - The output path for the compressed image
 * @property targetSize - The target size for the compressed image (optional)
 * @property filename - The filename for the compressed image (optional)
 * @property minQuality - The minimum quality for the compressed image (optional)
 */
interface CompressImageOptions {
	inputFile: File;
	outputPath: string;
	targetSize?: number;
	filename?: string;
	minQuality?: number;
}

/**
 * Compresses an image according to the specified options
 *
 * @param options - The compression options.
 * @returns a promise that resolves with the compressed image as a buffer.
 */
async function compressImage(options: CompressImageOptions) {
	let quality = 80;

	/**
	 * Processes the image compression
	 *
	 * @returns compressed image as a buffer
	 */
	async function processImage() {
		return await sharp(await options.inputFile.arrayBuffer())
			.jpeg({ quality, mozjpeg: true })
			.toBuffer();
	}

	let buffer = await processImage();

	if (options.targetSize) {
		while (
			buffer.length > options.targetSize &&
			quality > (options.minQuality ?? 10)
		) {
			quality -= 5;
			buffer = await processImage();
		}
	}

	return buffer;
}

export default compressImage;
