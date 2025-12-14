import { zValidator } from "@hono/zod-validator";
import type {
	Context,
	Env,
	Input,
	MiddlewareHandler,
	TypedResponse,
	ValidationTargets,
} from "hono";
import type { input as ZodInput, output as ZodOutput, ZodTypeAny } from "zod";
import DashboardError from "../errors/DashboardError";
// Local hook type retained for external callers for backwards compatibility
export type Hook<T, E extends Env, P extends string, O = {}> = (
	result:
		| { success: true; data: T }
		| { success: false; error: unknown; data: T },
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
	T extends ZodTypeAny = ZodTypeAny,
	Target extends keyof ValidationTargets = keyof ValidationTargets,
	E extends Env = Env,
	P extends string = string,
	In = ZodInput<T>,
	Out = ZodOutput<T>,
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
											[K2 in keyof In]: ValidationTargets[K][K2];
										})
						| undefined;
				}
			: {
					[K in Target]: K extends "json"
						? In
						: HasUndefined<keyof ValidationTargets[K]> extends true
							? {
									[K2 in keyof In]?:
										| ValidationTargets[K][K2]
										| undefined;
								}
							: { [K2 in keyof In]: ValidationTargets[K][K2] };
				};
		out: { [K in Target]: Out };
	},
	V extends I = I,
>(
	target: Target,
	schema: T,
	hook?: Hook<Out, E, P, {}> | undefined,
): MiddlewareHandler<E, P, V> {
	// Default hook that handles validation errors by throwing DashboardError
	const defaultHook = (result: {
		success: boolean;
		data?: unknown;
		error?: unknown;
		target?: string;
	}) => {
		if (!("success" in result) || result.success) return undefined;
		type Flatten = { fieldErrors: Record<string, string[]> };
		const flattenFn = (result.error as { flatten?: () => Flatten })?.flatten;
		const fieldErrors = flattenFn ? flattenFn().fieldErrors : {};
		const firstErrors: Record<string, string> = {};
		for (const field in fieldErrors) {
			firstErrors[field] = fieldErrors[field]?.[0] || "";
		}
		throw new DashboardError({
			errorCode: "INVALID_FORM_DATA",
			message:
				"Validation failed. Please check your input and try again.",
			formErrors: firstErrors,
			severity: "LOW",
			statusCode: 422,
		});
	};

	// Use type assertion to bridge the gap between our Hook type and zValidator's Hook type
	// This is necessary because zValidator's Hook type includes additional properties (target, Schema generic)
	// that are not needed for our validation error handling logic
	const hookToUse = (hook ?? defaultHook) as Parameters<typeof zValidator>[2];

	return zValidator(target, schema, hookToUse) as unknown as MiddlewareHandler<
		E,
		P,
		V
	>;
}

export default requestValidator;
