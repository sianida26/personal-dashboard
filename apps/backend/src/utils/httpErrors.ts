import { HTTPException } from "hono/http-exception";

export const forbidden = () => {
	throw new HTTPException(403, {
		message: "You are not allowed nor authorized to do this action",
	});
};
