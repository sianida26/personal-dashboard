import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	server:
		process.env.NODE_ENV === "development"
			? {
					port: Number(process.env.VITE_PORT) || 3000,
					host: process.env.VITE_HOST || "0.0.0.0",
				}
			: {},
});
