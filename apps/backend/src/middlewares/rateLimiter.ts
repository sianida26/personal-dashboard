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

const rateLimit = (config: Partial<RateLimitOptions> = {}) => {
	return rateLimiter({
		...defaultRateLimitConfig,
		...config,
	});
};

export default rateLimit;
