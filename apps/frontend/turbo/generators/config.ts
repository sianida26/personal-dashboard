import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI) {
	plop.setGenerator("page-template", {
		description: "Generate a new page template",
		prompts: [
			{
				type: "input",
				name: "title",
				message: "What is the page template title?",
				validate: (input: string) => {
					if (!input) return "Page template name is required";
					return true;
				},
			},
			{
				type: "input",
				name: "path",
				message:
					"What is the path for the page template (no initial /)?",
				validate: (input: string) => {
					if (!input) return "Path is required";
					return true;
				},
			},
			{
				type: "input",
				name: "endpoint",
				message: "Enter the backend endpoint (e.g. users):",
				validate: (input: string) => {
					if (!input) return "Backend endpoint is required";
					return true;
				},
			},
		],
		actions: [
			{
				type: "add",
				path: "src/routes/_dashboardLayout/{{path}}.tsx",
				templateFile: "templates/page-template/index.hbs",
			},
			{
				type: "add",
				path: "src/routes/_dashboardLayout/{{path}}.lazy.tsx",
				templateFile: "templates/page-template/index.lazy.hbs",
			},
			{
				type: "add",
				path: "src/routes/_dashboardLayout/{{path}}/create.tsx",
				templateFile: "templates/page-template/create.hbs",
			},
			{
				type: "add",
				path: "src/routes/_dashboardLayout/{{path}}/detail.$id.tsx",
				templateFile: "templates/page-template/detail.hbs",
			},
			{
				type: "add",
				path: "src/routes/_dashboardLayout/{{path}}/edit.$id.tsx",
				templateFile: "templates/page-template/edit.hbs",
			},
			{
				type: "add",
				path: "src/routes/_dashboardLayout/{{path}}/delete.tsx",
				templateFile: "templates/page-template/delete.hbs",
			},
		],
	});
}