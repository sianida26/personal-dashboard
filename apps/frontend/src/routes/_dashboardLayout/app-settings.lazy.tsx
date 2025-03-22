import { createPageTemplate } from "@/components/PageTemplate";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@repo/ui";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";
import { createLazyFileRoute } from "@tanstack/react-router";
import { TbEdit } from "react-icons/tb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@repo/ui/hooks";
import { APP_SETTING_DESCRIPTIONS, type AppSettingKey } from "@repo/data";

// Define the AppSetting type
interface AppSetting {
	id: string;
	key: string;
	value: string;
	createdAt: string;
	updatedAt: string;
}

export const Route = createLazyFileRoute("/_dashboardLayout/app-settings")({
	component: AppSettingsPage,
});

function EditSettingDialog({
	setting,
	isOpen,
	onClose,
}: { setting: AppSetting; isOpen: boolean; onClose: () => void }) {
	const [value, setValue] = useState(setting?.value || "");
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation({
		mutationFn: async (data: { id: string; value: string }) => {
			return client["app-settings"][":id"].$put({
				param: { id: data.id },
				json: { id: data.id, value: data.value },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["app-settings"] });
			toast({
				title: "Setting updated",
				description: "The setting has been updated successfully.",
			});
			onClose();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: `Failed to update setting. ${error.message}`,
				variant: "destructive",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (setting?.id) {
			mutation.mutate({ id: setting.id, value });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Setting: {setting.key}</DialogTitle>
					<DialogDescription>
						Update the value for this application setting.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-key" className="text-right">
								Key
							</Label>
							<div className="col-span-3 text-sm text-muted-foreground border px-3 py-2 rounded-md">
								{setting.key}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-value" className="text-right">
								Value
							</Label>
							<Input
								id="edit-value"
								value={value}
								onChange={(e) => setValue(e.target.value)}
								className="col-span-3"
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default function AppSettingsPage() {
	const [editSetting, setEditSetting] = useState<AppSetting | null>(null);

	// Get description for a setting key
	const getKeyDescription = (key: string): string => {
		return APP_SETTING_DESCRIPTIONS[key as AppSettingKey] || "";
	};

	return (
		<>
			{editSetting && (
				<EditSettingDialog
					setting={editSetting}
					isOpen={!!editSetting}
					onClose={() => setEditSetting(null)}
				/>
			)}

			{createPageTemplate({
				title: "App Settings",
				endpoint: client["app-settings"].$get,
				queryKey: ["app-settings"],
				sortableColumns: ["key"],
				columnBorders: true,
				columnDefs: (helper) => [
					helper.display({
						header: "#",
						cell: (props) =>
							props.table.getState().pagination.pageIndex *
								props.table.getState().pagination.pageSize +
							props.row.index +
							1,
						size: 1,
					}),
					helper.accessor("key", {
						cell: (info) => info.getValue(),
						header: ({ column }) => {
							return (
								<Button
									variant="ghost"
									onClick={() =>
										column.toggleSorting(
											column.getIsSorted() === "asc",
										)
									}
								>
									Key
								</Button>
							);
						},
					}),
					helper.display({
						id: "description",
						header: "Description",
						cell: (props) => (
							<div className="text-sm text-muted-foreground">
								{getKeyDescription(props.row.original.key)}
							</div>
						),
					}),
					helper.accessor("value", {
						cell: (info) => info.getValue(),
						header: "Value",
					}),
					helper.accessor("updatedAt", {
						cell: (info) => {
							const date = info.getValue();
							return date
								? new Date(date).toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
									})
								: "-";
						},
						header: "Updated At",
					}),
					helper.display({
						header: "Actions",
						cell: (props) => (
							<div className="flex gap-2">
								{createActionButtons([
									{
										label: "Edit",
										permission: true,
										action: () =>
											setEditSetting(
												props.row
													.original as AppSetting,
											),
										className:
											"bg-yellow-500 hover:bg-yellow-600",
										icon: <TbEdit />,
									},
								])}
							</div>
						),
					}),
				],
			})}
		</>
	);
}
