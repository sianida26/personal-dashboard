import { MultiSelect } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_dashboardLayout/dev/multi-select")({
	component: RouteComponent,
});

const options = [
	{
		value: "a",
		label: "a",
	},
	{
		value: "b",
		label: "b",
	},
];

function RouteComponent() {
	const [values, setValues] = useState<string[]>([]);

	return (
		<MultiSelect
			onChange={(values) => {
				setValues(values);
				console.log(values);
			}}
			options={options}
			selectedOptions={values}
		/>
	);
}
