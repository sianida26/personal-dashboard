import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import whatsappWebhookRoute from "./whatsapp-webhook";

const webhooksRoute = new Hono<HonoEnv>();

webhooksRoute.route("/whatsapp", whatsappWebhookRoute);

export default webhooksRoute;
