import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import deleteUjianByIdRoute from "./delete-ujian-by-id";
import getUjianRoute from "./get-ujian";
import getUjianByIdRoute from "./get-ujian-by-id";
import patchUjianByIdRoute from "./patch-ujian-by-id";
import postUjianRoute from "./post-ujian";

const ujianRoute = new Hono<HonoEnv>()
	.route("/", getUjianRoute)
	.route("/", postUjianRoute)
	.route("/", getUjianByIdRoute)
	.route("/", patchUjianByIdRoute)
	.route("/", deleteUjianByIdRoute);

export default ujianRoute;
