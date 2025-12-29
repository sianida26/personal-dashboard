import { Badge, Button } from "@repo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { TbEye, TbPencil, TbTrash } from "react-icons/tb";
import {
	type AdaptiveColumnDef,
	ServerDataTable,
} from "@/components/AdaptiveTable";
import client from "@/honoClient";
import { usePermissions } from "@/hooks/useAuth";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute("/_dashboardLayout/ujian/")({
	component: UjianPage,
});

export default function UjianPage() {
	usePermissions("ujian.read");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await fetchRPC(
				client.ujian[":id"].$delete({
					param: { id },
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ujian"] });
		},
	});

	// biome-ignore lint/suspicious/noExplicitAny: Using any for dynamic API response
	const columns = useMemo<AdaptiveColumnDef<any>[]>(
		() => [
			{
				accessorKey: "title",
				header: "Title",
				cell: (info) => (
					<div className="flex flex-col">
						<span className="font-medium">
							{String(info.getValue())}
						</span>
						{info.row.original.description && (
							<span className="text-xs text-muted-foreground line-clamp-1">
								{info.row.original.description}
							</span>
						)}
					</div>
				),
			},
			{
				accessorKey: "totalQuestions",
				header: "Questions",
				cell: (info) => (
					<Badge variant="secondary">
						{String(info.getValue())} questions
					</Badge>
				),
			},
			{
				accessorKey: "maxQuestions",
				header: "Max Display",
				cell: (info) => (
					<span className="text-sm text-muted-foreground">
						{String(info.getValue())} questions
					</span>
				),
			},
			{
				accessorKey: "practiceMode",
				header: "Mode",
				cell: (info) => (
					<Badge variant={info.getValue() ? "default" : "outline"}>
						{info.getValue() ? "Practice" : "Normal"}
					</Badge>
				),
			},
			{
				accessorKey: "isActive",
				header: "Status",
				cell: (info) => (
					<Badge
						variant={info.getValue() ? "default" : "destructive"}
					>
						{info.getValue() ? "Active" : "Inactive"}
					</Badge>
				),
			},
			{
				accessorKey: "creator",
				header: "Created By",
				cell: (info) => {
					// biome-ignore lint/suspicious/noExplicitAny: Dynamic API response type
					const creator = info.getValue() as any;
					return creator ? (
						<div className="flex flex-col">
							<span className="text-sm">{creator.name}</span>
							<span className="text-xs text-muted-foreground">
								@{creator.username}
							</span>
						</div>
					) : (
						<span className="text-sm text-muted-foreground">—</span>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				cell: (props) => (
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							className="h-8 w-8 p-0"
							onClick={() => {
								navigate({
									to: `/ujian/edit/${props.row.original.id}`,
								});
							}}
						>
							<TbEye className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-8 w-8 p-0"
							onClick={() => {
								navigate({
									to: `/ujian/edit/${props.row.original.id}`,
								});
							}}
						>
							<TbPencil className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-8 w-8 p-0 text-destructive hover:text-destructive"
							onClick={async () => {
								if (
									confirm(
										"Are you sure you want to delete this ujian? This will also delete all questions and attempts.",
									)
								) {
									await deleteMutation.mutateAsync(
										props.row.original.id,
									);
								}
							}}
							disabled={deleteMutation.isPending}
						>
							<TbTrash className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		],
		[navigate, deleteMutation],
	);

	return (
		<div className="p-4 h-full flex flex-col overflow-hidden">
			<div className="flex-1 min-h-0">
				<ServerDataTable
					// Data fetching
					endpoint={client.ujian.$get}
					queryKey={["ujian"]}
					fetchFn={fetchRPC}
					// Table configuration
					columns={columns}
					saveState="ujian-table"
					title="Ujian (Exams)"
					// Pagination
					pagination
					pageSizeOptions={[10, 25, 50, 100]}
					// Features
					columnOrderable
					columnResizable
					sortable
					search
					rowSelectable
					fitToParentWidth
					newButton
					// Callbacks
					onNewButtonClick={() => {
						navigate({ to: "/ujian/create" });
					}}
				/>
			</div>
		</div>
	);
}
