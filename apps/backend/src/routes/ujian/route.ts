import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import deleteUjianByIdRoute from "./delete-ujian-by-id";
import deleteUjianQuestionRoute from "./delete-ujian-question";
import getAttemptResultsRoute from "./get-attempt-results";
import getAvailableUjianRoute from "./get-available-ujian";
import getMyAttemptsRoute from "./get-my-attempts";
import getUjianRoute from "./get-ujian";
import getUjianByIdRoute from "./get-ujian-by-id";
import patchUjianByIdRoute from "./patch-ujian-by-id";
import patchUjianQuestionRoute from "./patch-ujian-question";
import postCompleteUjianRoute from "./post-complete-ujian";
import postStartUjianRoute from "./post-start-ujian";
import postSubmitAnswerRoute from "./post-submit-answer";
import postUjianRoute from "./post-ujian";
import postUjianQuestionRoute from "./post-ujian-question";

const ujianRoute = new Hono<HonoEnv>()
	// Admin routes
	.route("/", getUjianRoute)
	.route("/", postUjianRoute)
	.route("/", getUjianByIdRoute)
	.route("/", patchUjianByIdRoute)
	.route("/", deleteUjianByIdRoute)
	.route("/", postUjianQuestionRoute)
	.route("/", patchUjianQuestionRoute)
	.route("/", deleteUjianQuestionRoute)
	// Peserta routes
	.route("/", getAvailableUjianRoute)
	.route("/", getMyAttemptsRoute)
	.route("/", postStartUjianRoute)
	.route("/", postSubmitAnswerRoute)
	.route("/", postCompleteUjianRoute)
	.route("/", getAttemptResultsRoute);

export default ujianRoute;
