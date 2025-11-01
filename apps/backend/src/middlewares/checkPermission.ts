import { SpanStatusCode, trace } from "@opentelemetry/api";
import type { ExtendedPermissionCodeWithAll } from "@repo/data";
import { createMiddleware } from "hono/factory";
import { forbidden, unauthorized } from "../errors/DashboardError";
import type HonoEnv from "../types/HonoEnv";
import { permissionMetrics } from "../utils/custom-metrics";

/**
 * Creates a middleware to check if the current user has the required permissions.
 *
 * This middleware checks if the current user's permissions include any of the specified
 * permissions required to proceed. It allows proceeding if the user has the requisite
 * permissions or denies access by triggering an unauthorized error.
 *
 * @param permissions - An array of permissions to check against the current user's permissions.
 * @returns A middleware function for the Hono framework.
 */
const checkPermission = (...permissions: ExtendedPermissionCodeWithAll[]) =>
	createMiddleware<HonoEnv>(async (c, next) => {
		const tracer = trace.getTracer("dashboard-backend");

		return tracer.startActiveSpan("permission.check", async (span) => {
			try {
				// Add attributes
				span.setAttribute("permission.required", permissions.join(","));
				span.setAttribute("http.route", c.req.path);

				// Allow all operations if the permissions include a wildcard "*"
				if (permissions.includes("*")) {
					span.setAttribute("permission.result", "allowed_wildcard");
					span.setStatus({ code: SpanStatusCode.OK });
					await next();
					return;
				}

				const currentUser = c.var.currentUser;

				if (currentUser) {
					span.setAttribute(
						"user.permissions",
						currentUser.permissions.join(","),
					);
				} // Proceed if the user exists and has any of the required permissions
				if (currentUser) {
					const hasPermission = currentUser.permissions.some((p) =>
						permissions.includes(p),
					);
					if (
						hasPermission ||
						permissions.includes("authenticated-only")
					) {
						span.setAttribute("permission.result", "allowed");
						span.setStatus({ code: SpanStatusCode.OK });
						await next();
					} else if (permissions.includes("guest-only")) {
						// Track permission denial
						permissionMetrics.permissionDenials.add(1, {
							reason: "authenticated_user_on_guest_route",
							route: c.req.path,
						});
						span.setAttribute(
							"permission.result",
							"denied_authenticated_on_guest",
						);
						span.setStatus({ code: SpanStatusCode.ERROR });
						// Guest-only routes should return 401 for authenticated users (original behavior)
						unauthorized();
					} else {
						// Track permission denial
						permissionMetrics.permissionDenials.add(1, {
							reason: "insufficient_permissions",
							route: c.req.path,
						});
						span.setAttribute(
							"permission.result",
							"denied_insufficient",
						);
						span.setStatus({ code: SpanStatusCode.ERROR });
						// User exists but doesn't have the required permissions
						forbidden();
					}
				} else if (permissions.includes("guest-only")) {
					span.setAttribute("permission.result", "allowed_guest");
					span.setStatus({ code: SpanStatusCode.OK });
					await next();
				} else {
					// Track permission denial
					permissionMetrics.permissionDenials.add(1, {
						reason: "not_authenticated",
						route: c.req.path,
					});
					span.setAttribute(
						"permission.result",
						"denied_not_authenticated",
					);
					span.setStatus({ code: SpanStatusCode.ERROR });
					// No current user found, trigger unauthorized error
					unauthorized();
				}
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR });
				throw error;
			} finally {
				span.end();
			}
		});
	});

export default checkPermission;
