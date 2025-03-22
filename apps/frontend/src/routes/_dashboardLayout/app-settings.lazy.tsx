import { createPageTemplate } from "@/components/PageTemplate";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
} from "@repo/ui";
import client from "@/honoClient";
import createActionButtons from "@/utils/createActionButton";
import { createLazyFileRoute } from "@tanstack/react-router";
import { TbEdit, TbPlus, TbTrash } from "react-icons/tb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@repo/ui/hooks";

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

function AddSettingDialog({
	isOpen,
	onClose,
}: { isOpen: boolean; onClose: () => void }) {
	const [key, setKey] = useState("");
	const [value, setValue] = useState("");
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation({
		mutationFn: async (data: { key: string; value: string }) => {
			return client["app-settings"].$post({
				json: data,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["app-settings"] });
			toast({
				title: "Setting added",
				description: "The setting has been added successfully.",
			});
			setKey("");
			setValue("");
			onClose();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: `Failed to add setting. ${error.message}`,
				variant: "destructive",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate({ key, value });
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Setting</DialogTitle>
					<DialogDescription>
						Create a new application setting with a key-value pair.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="key" className="text-right">
								Key
							</Label>
							<Input
								id="key"
								value={key}
								onChange={(e) => setKey(e.target.value)}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="value" className="text-right">
								Value
							</Label>
							<Input
								id="value"
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

function EditSettingDialog({
	setting,
	isOpen,
	onClose,
}: { setting: AppSetting; isOpen: boolean; onClose: () => void }) {
	const [key, setKey] = useState(setting?.key || "");
	const [value, setValue] = useState(setting?.value || "");
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation({
		mutationFn: async (data: {
			id: string;
			key: string;
			value: string;
		}) => {
			return client["app-settings"][":id"].$put({
				param: { id: data.id },
				json: { key: data.key, value: data.value },
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
			mutation.mutate({ id: setting.id, key, value });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Setting</DialogTitle>
					<DialogDescription>
						Update the key-value pair for this application setting.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-key" className="text-right">
								Key
							</Label>
							<Input
								id="edit-key"
								value={key}
								onChange={(e) => setKey(e.target.value)}
								className="col-span-3"
								required
							/>
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
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editSetting, setEditSetting] = useState<AppSetting | null>(null);
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return client["app-settings"][":id"].$delete({
				param: { id },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["app-settings"] });
			toast({
				title: "Setting deleted",
				description: "The setting has been deleted successfully.",
			});
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: `Failed to delete setting. ${error.message}`,
				variant: "destructive",
			});
		},
	});

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this setting?")) {
			deleteMutation.mutate(id);
		}
	};

	return (
		<>
			<AddSettingDialog
				isOpen={isAddDialogOpen}
				onClose={() => setIsAddDialogOpen(false)}
			/>

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
				createButton: (
					<Button onClick={() => setIsAddDialogOpen(true)}>
						<TbPlus className="mr-2 h-4 w-4" />
						Add Setting
					</Button>
				),
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
									{
										label: "Delete",
										permission: true,
										action: () =>
											handleDelete(props.row.original.id),
										variant: "outline",
										className:
											"border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
										icon: <TbTrash />,
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