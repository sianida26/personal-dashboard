import type { PlopTypes } from "@turbo/gen";

// Learn more about Turborepo Generators at https://turbo.build/repo/docs/core-concepts/monorepos/code-generation

export default function generator(plop: PlopTypes.NodePlopAPI) {
	plop.setGenerator("add-schema", {
		description: "Adds a new schema to the DB",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "What is the name of the schema? (use plural name)",
			},
			{
				type: "confirm",
				name: "hasSoftDelete",
				message: "Does this schema have soft delete?",
			},
		],
		actions: (data) => [
			// Add the schema file
			{
				type: "add",
				path: "src/drizzle/schema/{{camelCase name}}.ts",
				templateFile: "templates/db-schema.hbs",
			},

			// Import the schema in index.ts
			{
				type: "append",
				path: "src/drizzle/index.ts",
				pattern: /import \* as usersSchema from ".\/schema\/users";/g,
				template: `import * as {{camelCase name}}Schema from "./schema/{{camelCase name}}";`,
			},

			// Add the schema to the db object
			{
				type: "append",
				path: "src/drizzle/index.ts",
				pattern: /schema: {/g,
				template: "\t\t...{{camelCase name}}Schema,",
			},
		],
	});

	plop.setGenerator("basic-crud", {
		description: "Adds a Basic CRUD route API",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "What is the name of the route?",
			},
			{
				type: "input",
				name: "permission",
				message: "What is the permission group for this route?",
			},
			{
				type: "input",
				name: "model",
				message: "What is the DB model name for this route?",
			},
		],
		actions: [
			// Add the route file
			{
				type: "add",
				path: "src/routes/{{kebabCase name}}/route.ts",
				templateFile: "templates/basic-route.hbs",
			},

			//Add import to index.ts
			{
				type: "append",
				path: "src/index.ts",
				pattern: /import type HonoEnv from "\.\/types\/HonoEnv";/g,
				template:
					'import {{camelCase name}}Route from "./routes/{{kebabCase name}}/route"',
			},

			//Add route to index.ts
			{
				type: "append",
				path: "src/index.ts",
				pattern: /\.route\("\/dev", devRoutes\)/g,
				template:
					'\t.route("/{{kebabCase name}}", {{camelCase name}}Route)',
			},
		],
	});
}
