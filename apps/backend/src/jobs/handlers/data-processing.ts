import { z } from "zod";
import type { JobHandler } from "../../services/jobs/types";

const payloadSchema = z.object({
	operation: z.enum(["sum", "average", "max", "min"]),
	data: z.array(z.number()),
	description: z.string().optional(),
});

type DataProcessingPayload = z.infer<typeof payloadSchema>;

const dataProcessingHandler: JobHandler<DataProcessingPayload> = {
	type: "data-processing",
	description: "Process numerical data with various operations",
	defaultMaxRetries: 2,
	defaultTimeoutSeconds: 60,

	validate(payload: unknown): DataProcessingPayload {
		return payloadSchema.parse(payload);
	},

	async execute(payload, context) {
		const { operation, data, description } = payload;

		context.logger.info(
			`Processing ${data.length} numbers with operation: ${operation}`,
		);

		if (data.length === 0) {
			return {
				success: false,
				message: "No data provided for processing",
				shouldRetry: false,
			};
		}

		try {
			let result: number;

			switch (operation) {
				case "sum":
					result = data.reduce((sum, num) => sum + num, 0);
					break;
				case "average":
					result =
						data.reduce((sum, num) => sum + num, 0) / data.length;
					break;
				case "max":
					result = Math.max(...data);
					break;
				case "min":
					result = Math.min(...data);
					break;
				default:
					throw new Error(`Unknown operation: ${operation}`);
			}

			// Simulate processing time
			await new Promise((resolve) => setTimeout(resolve, 500));

			context.logger.info(`Data processing completed. Result: ${result}`);

			return {
				success: true,
				message: `${operation} operation completed`,
				data: {
					operation,
					result,
					inputSize: data.length,
					description,
				},
			};
		} catch (error) {
			const errorMsg = new Error(
				`Data processing failed: ${(error as Error).message}`,
			);
			context.logger.error(errorMsg);

			return {
				success: false,
				message: (error as Error).message,
				shouldRetry: false, // Don't retry data processing errors
			};
		}
	},

	async onFailure(error, context) {
		const errorMsg = new Error(
			`Data processing failed permanently for job ${context.jobId}: ${error.message}`,
		);
		context.logger.error(errorMsg);
	},

	async onSuccess(_result, context) {
		context.logger.info(
			`Data processing completed successfully for job ${context.jobId}`,
		);
	},
};

export default dataProcessingHandler;
