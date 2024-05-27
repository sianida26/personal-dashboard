import sharp from "sharp";
import { fileURLToPath } from "url";

/**
 * Options for compressing an image.
 */
export interface CompressImageOptions {
	/** The input file to compress */
	inputFile: File;
	/** The target size for the compressed image in bytes (optional) */
	targetSize?: number;
	/** The minimum quality for the compressed image (optional, default is 10) */
	minQuality?: number;
	/** Flag to force compression even if not necessary (optional, default is true) */
	forceCompress?: boolean;
}

/**
 * Compresses an image according to the specified options
 *
 * @param options - The compression options.
 * @returns a promise that resolves with the compressed image as a buffer.
 */
async function compressImage(options: CompressImageOptions) {
	let quality = 80;
	const forceCompress = options.forceCompress ?? true;

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

	let buffer = forceCompress
		? await processImage()
		: Buffer.from(await options.inputFile.arrayBuffer());

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
