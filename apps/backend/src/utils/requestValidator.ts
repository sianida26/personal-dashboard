import { zValidator } from "@hono/zod-validator";
import DashboardError from "../errors/DashboardError";

type ValidatorParameters = Parameters<typeof zValidator>;

/**
 * Creates a request validator using the Zod schema.
 * This middleware function is designed for use with the Hono framework to validate incoming requests.
 * If the validation fails, it throws a `DashboardError` with detailed information about the validation errors.
 *
 * @param parameters - Parameters expected by `zValidator`. The first parameter is the Zod schema,
 * the second is options for the Zod validator, and the third is a custom error handler.
 * @returns A middleware function that validates the request against the provided schema.
 */
const requestValidator = (...parameters: ValidatorParameters) => {
	return zValidator(
		parameters[0],
		parameters[1],
		parameters[2] ??
			((result) => {
				if (!result.success) {
					let errors = result.error.flatten().fieldErrors as Record<
						string,
						string[]
					>;
					let firstErrors: Record<string, string> = {};
					for (let field in errors) {
						firstErrors[field] = errors[field][0]; // Grabbing the first error message for each field
					}
					throw new DashboardError({
						errorCode: "INVALID_FORM_DATA",
						message:
							"Validation failed. Please check your input and try again.",
						formErrors: firstErrors,
						severity: "LOW",
						statusCode: 422,
					});
				}
			})
	);
};

export default requestValidator;
