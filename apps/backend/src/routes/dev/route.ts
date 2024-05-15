import { Hono } from "hono";
import authInfo from "../../middlewares/authInfo";
import HonoEnv from "../../types/HonoEnv";
import { z } from "zod";
import requestValidator from "../../utils/requestValidator";
import compressImage from "../../utils/compressImage";
import checkPermission from "../../middlewares/checkPermission";
import { createId } from "@paralleldrive/cuid2";
import { writeFileSync } from "fs";

const fileSchema = z.object({
	file: z.instanceof(File),
});

const devRoutes = new Hono<HonoEnv>()
	.use(authInfo)
	.use(checkPermission("dev-routes"))
	.get("/middleware", async (c) => {
		return c.json({
			message: "Middleware works!",
		});
	})
	.post("/file", requestValidator("form", fileSchema), async (c) => {
		const { file } = c.req.valid("form");

		const buffer = await compressImage({
			inputFile: file,
			targetSize: 500 * 1024,
		});

		const filename = `${createId()}.jpg`;

		writeFileSync(`images/${filename}`, buffer);

		return c.json({
			message: `File saved! name: ${filename}`,
		});
	});

export default devRoutes;
