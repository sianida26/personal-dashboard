import { rateLimiter } from "hono-rate-limiter";
import type ArgType from "../types/ArgType";

type RateLimitOptions = ArgType<typeof rateLimiter>;

export const defaultRateLimitConfig: RateLimitOptions = {
	windowMs: 60 * 1000, // 1 minute
	limit: 100, // 100 requests per window per IP
	keyGenerator: (c) =>
		c.req.header("x-forwarded-for") ||
		c.req.header("cf-connecting-ip") ||
		c.req.header("x-real-ip") ||
		c.req.header("host") ||
		"unknown",
	standardHeaders: true,

	// Skip rate limit for test environment
	// If the header x-enable-rate-limit is set to true, the rate limit will be applied
	skip: (c) =>
		process.env.NODE_ENV === "test" && !c.req.header("x-enable-rate-limit"),
};

/**
 * Auth rate limit configuration
 * 5 attempts per 15 minutes to prevent brute force attacks
 */
export const authRateLimitConfig: RateLimitOptions = {
	...defaultRateLimitConfig,
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 5, // 5 requests per window per IP
	message: "Too many login attempts. Please try again later.",
};

/**
 * OAuth rate limit configuration
 * 10 attempts per 5 minutes for OAuth flows
 */
export const oauthRateLimitConfig: RateLimitOptions = {
	...defaultRateLimitConfig,
	windowMs: 5 * 60 * 1000, // 5 minutes
	limit: 10, // 10 requests per window per IP
	message: "Too many OAuth attempts. Please try again later.",
};

/**
 * Register rate limit configuration
 * 3 attempts per hour to prevent account spam
 */
export const registerRateLimitConfig: RateLimitOptions = {
	...defaultRateLimitConfig,
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 3, // 3 requests per window per IP
	message: "Too many registration attempts. Please try again later.",
};

/**
 * Refresh token rate limit configuration
 * 10 attempts per 5 minutes for token refresh
 */
export const refreshRateLimitConfig: RateLimitOptions = {
	...defaultRateLimitConfig,
	windowMs: 5 * 60 * 1000, // 5 minutes
	limit: 10, // 10 requests per window per IP
	message: "Too many token refresh attempts. Please try again later.",
};

const rateLimit = (config: Partial<RateLimitOptions> = {}) => {
	return rateLimiter({
		...defaultRateLimitConfig,
		...config,
	});
};

export default rateLimit;
