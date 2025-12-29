import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import deleteUjianByIdRoute from "./delete-ujian-by-id";
import deleteUjianQuestionRoute from "./delete-ujian-question";
import getUjianRoute from "./get-ujian";
import getUjianByIdRoute from "./get-ujian-by-id";
import patchUjianByIdRoute from "./patch-ujian-by-id";
import patchUjianQuestionRoute from "./patch-ujian-question";
import postUjianRoute from "./post-ujian";
import postUjianQuestionRoute from "./post-ujian-question";

const ujianRoute = new Hono<HonoEnv>()
	.route("/", getUjianRoute)
	.route("/", postUjianRoute)
	.route("/", getUjianByIdRoute)
	.route("/", patchUjianByIdRoute)
	.route("/", deleteUjianByIdRoute)
	.route("/", postUjianQuestionRoute)
	.route("/", patchUjianQuestionRoute)
	.route("/", deleteUjianQuestionRoute);

export default ujianRoute;
