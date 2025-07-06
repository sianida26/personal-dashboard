import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import getRolesRoute from "./get-roles";
import postRolesRoute from "./post-roles";
import getRoleByIdRoute from "./get-role-by-id";
import patchRoleByIdRoute from "./patch-role-by-id";
import deleteRoleByIdRoute from "./delete-role-by-id";

const rolesRoute = new Hono<HonoEnv>()
	.route("/", getRolesRoute)
	.route("/", postRolesRoute)
	.route("/", getRoleByIdRoute)
	.route("/", patchRoleByIdRoute)
	.route("/", deleteRoleByIdRoute);

export default rolesRoute;
