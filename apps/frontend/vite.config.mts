import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

process.env = { ...process.env, ...loadEnv("", process.cwd()) };

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [TanStackRouterVite(), react(), tailwindcss()],
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
