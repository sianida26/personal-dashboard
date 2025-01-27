import { zValidator } from "@hono/zod-validator";
import type {
	Context,
	Env,
	Input,
	MiddlewareHandler,
	TypedResponse,
	ValidationTargets,
} from "hono";
import type { ZodError, z } from "zod";
import DashboardError from "../errors/DashboardError";
export type Hook<T, E extends Env, P extends string, O = {}> = (
	result:
		| {
				success: true;
				data: T;
		  }
		| {
				success: false;
				error: ZodError;
				data: T;
		  },
	c: Context<E, P>,
) =>
	| Response
	| Promise<Response>
	| undefined
	| Promise<Response | undefined>
	| TypedResponse<O>;
type HasUndefined<T> = undefined extends T ? true : false;

/**
 * Creates a request validator using the Zod schema.
 * This middleware function is designed for use with the Hono framework to validate incoming requests.
 * If the validation fails, it throws a `DashboardError` with detailed information about the validation errors.
 *
 * @param parameters - Parameters expected by `zValidator`. The first parameter is the Zod schema,
 * the second is options for the Zod validator, and the third is a custom error handler.
 * @returns A middleware function that validates the request against the provided schema.
 */
function requestValidator<
	// biome-ignore lint/suspicious/noExplicitAny: This is a generic type, so it's okay to use `any` here
	T extends z.ZodType<any, z.ZodTypeDef, any>,
	Target extends keyof ValidationTargets,
	E extends Env,
	P extends string,
	In = z.input<T>,
	Out = z.output<T>,
	I extends Input = {
		in: HasUndefined<In> extends true
			? {
					[K in Target]?:
						| (K extends "json"
								? In
								: HasUndefined<
											keyof ValidationTargets[K]
										> extends true
									? {
											[K2 in keyof In]?:
												| ValidationTargets[K][K2]
												| undefined;
										}
									: {
											[K2_1 in keyof In]: ValidationTargets[K][K2_1];
										})
						| undefined;
				}
			: {
					[K_1 in Target]: K_1 extends "json"
						? In
						: HasUndefined<
									keyof ValidationTargets[K_1]
								> extends true
							? {
									[K2_2 in keyof In]?:
										| ValidationTargets[K_1][K2_2]
										| undefined;
								}
							: {
									[K2_3 in keyof In]: ValidationTargets[K_1][K2_3];
								};
				};
		out: { [K_2 in Target]: Out };
	},
	V extends I = I,
>(
	target: Target,
	schema: T,
	hook?: Hook<z.TypeOf<T>, E, P, {}> | undefined,
): MiddlewareHandler<E, P, V> {
	//@ts-ignore
	return zValidator(
		target,
		schema,
		hook ??
			((result) => {
				if (!result.success) {
					const errors = result.error.flatten().fieldErrors as Record<
						string,
						string[]
					>;
					const firstErrors: Record<string, string> = {};
					for (const field in errors) {
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
			}),
	);
}

export default requestValidator;
