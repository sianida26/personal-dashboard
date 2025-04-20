import { Hono } from "hono";
import type HonoEnv from "../types/HonoEnv";

/**
 * Creates a new Hono instance typed with the project's HonoEnv.
 *
 * @returns A new Hono route instance with the correct environment typing.
 */
export const createHonoRoute = () => {
	return new Hono<HonoEnv>();
};
