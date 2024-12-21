import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

process.env = { ...process.env, ...loadEnv("", process.cwd()) };

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), TanStackRouterVite()],
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	server: {
		port: Number(process.env.VITE_PORT),
		host: process.env.VITE_HOST,
	},
});
