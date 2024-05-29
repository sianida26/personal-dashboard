import { serveStatic } from "@hono/node-server/serve-static";

/**
 * Serves static files from the specified folder, rewriting the request path.
 *
 * @param path - The root directory from which to serve static files.
 * @returns A middleware that serves static files with the modified request path.
 */
const staticFolder = (path: string) =>
	serveStatic({
		root: path,
		rewriteRequestPath: (path) => path.replace(/.*\//, "./"),
	});

export default staticFolder;
