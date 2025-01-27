import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setGenerator("permission", {
		description: "Add a new permission or CRUD permission group",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "What is the permission name? (e.g. users, posts)",
				validate: (input: string) => {
					if (!input) return "Permission name is required";
					return true;
				},
			},
			{
				type: "list",
				name: "type",
				message: "What type of permission?",
				choices: [
					{ name: "Single Permission", value: "single" },
					{ name: "CRUD Group", value: "crud" },
				],
			},
			{
				type: "input",
				name: "description",
				message: "Enter permission description:",
				when: (answers) => answers.type === "single",
			},
		],
		actions: (answers) => {
			const actions: PlopTypes.ActionType[] = [];

			if (answers?.type === "single") {
				actions.push({
					type: "append",
					path: "src/permissions.ts",
					pattern: "export const permissions = [",
					template: "\t'{{camelCase name}}',",
				});
			} else if (answers?.type === "crud") {
				const crudActions = ["create", "read", "update", "delete"];
				for (const action of crudActions) {
					actions.push({
						type: "append",
						path: "src/permissions.ts",
						pattern: "export const permissions = [",
						template: `\t"{{camelCase name}}.${action}",`,
					});
				}
			}

			return actions;
		},
	});
}
