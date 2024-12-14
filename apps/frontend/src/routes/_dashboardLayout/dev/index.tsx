import MultiSelect from "@/components/ui/multi-select";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_dashboardLayout/dev/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [selectedItems, setSelectedItems] = useState<string[]>([]);

	return (
		<div className="w-64 m-8">
			<MultiSelect
				onChange={(options) => {
					setSelectedItems(options);
				}}
				options={[
					{ label: "aaa", value: "bbbb" },
					{ label: "ccc", value: "cccc" },
					{ label: "ddd", value: "dddd" },
					{ label: "eee", value: "eeee" },
				]}
				placeholder="Placeholder"
				selectedOptions={selectedItems}
			/>
		</div>
	);
}
