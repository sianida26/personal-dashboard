import { Badge, Button, Card } from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { TbFolder, TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import { AdaptiveTable } from "@/components/AdaptiveTable/AdaptiveTable";
import type { AdaptiveColumnDef } from "@/components/AdaptiveTable/types";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute("/_dashboardLayout/categories")({
	component: CategoriesPage,
});

interface Category {
	id: string;
	userId: string;
	name: string;
	type: "income" | "expense";
	icon: string | null;
	color: string | null;
	parentId: string | null;
	isActive: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	transactionCount: number;
	children?: Category[];
}

export default function CategoriesPage() {
	const navigate = useNavigate();

	// Fetch categories
	const { data: categoriesResponse, isLoading } = useQuery({
		queryKey: ["categories", "all"],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.categories.$get({
					query: { includeInactive: "true" },
				}),
			);
			return res;
		},
	});

	const categories = (categoriesResponse?.data as Category[]) ?? [];

	const handleEdit = (id: string) => {
		navigate({
			to: "/categories/edit/$categoryId",
			params: { categoryId: id },
		});
	};

	const handleDelete = (id: string) => {
		navigate({
			to: "/categories/delete/$categoryId",
			params: { categoryId: id },
		});
	};

	const handleView = (category: Category) => {
		navigate({
			to: "/categories/view/$categoryId",
			params: { categoryId: category.id },
		});
	};

	// Define columns for AdaptiveTable
	const columns: AdaptiveColumnDef<Category>[] = useMemo(
		() => [
			{
				id: "icon",
				header: "",
				accessorFn: (row) => row.icon,
				size: 50,
				enableSorting: false,
				cell: ({ row }) => {
					const category = row.original;
					return (
						<div
							className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
							style={{
								backgroundColor: category.color
									? `${category.color}20`
									: "var(--accent)",
								color: category.color || "inherit",
							}}
						>
							{category.icon || <TbFolder />}
						</div>
					);
				},
			},
			{
				id: "name",
				header: "Nama",
				accessorKey: "name",
				cell: ({ row }) => {
					const category = row.original;
					return (
						<div className="flex items-center gap-2">
							<span className="font-medium">{category.name}</span>
							{!category.isActive && (
								<Badge variant="outline" className="text-xs">
									Nonaktif
								</Badge>
							)}
						</div>
					);
				},
			},
			{
				id: "type",
				header: "Tipe",
				accessorKey: "type",
				filterType: "select",
				options: [
					{ label: "Pengeluaran", value: "expense" },
					{ label: "Pemasukan", value: "income" },
				],
				cell: ({ row }) => {
					const type = row.original.type;
					return (
						<Badge
							className={`text-xs ${
								type === "income"
									? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
									: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
							}`}
						>
							{type === "income" ? "Pemasukan" : "Pengeluaran"}
						</Badge>
					);
				},
			},
			{
				id: "transactionCount",
				header: "Transaksi",
				accessorKey: "transactionCount",
				cell: ({ row }) => {
					return (
						<span className="text-muted-foreground">
							{row.original.transactionCount} transaksi
						</span>
					);
				},
			},
			{
				id: "actions",
				header: "",
				size: 100,
				enableSorting: false,
				cell: ({ row }) => {
					const category = row.original;
					return (
						<div className="flex items-center gap-1 justify-end">
							<Button
								size="icon"
								variant="ghost"
								className="h-8 w-8"
								onClick={(e) => {
									e.stopPropagation();
									handleEdit(category.id);
								}}
							>
								<TbPencil className="h-4 w-4" />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								className="h-8 w-8 text-destructive hover:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(category.id);
								}}
							>
								<TbTrash className="h-4 w-4" />
							</Button>
						</div>
					);
				},
			},
		],
		[],
	);

	return (
		<div className="p-6 h-full flex flex-col overflow-hidden">
			<Card className="flex-1 p-6 flex flex-col overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold">Kategori</h1>
						<p className="text-muted-foreground">
							Kelola kategori pemasukan dan pengeluaran Anda
						</p>
					</div>
					<Link to="/categories/create" search={{ type: "expense" }}>
						<Button leftSection={<TbPlus />}>
							Tambah Kategori
						</Button>
					</Link>
				</div>

				{/* Table */}
				<div className="flex-1 overflow-hidden">
					<AdaptiveTable
						columns={columns}
						data={categories}
						isLoading={isLoading}
						saveState="categories-table"
						showDetail={true}
						onDetailClick={handleView}
						groupable={true}
						search={true}
						filterable={true}
						pagination={false}
						rowHeight={48}
						columnResizable={true}
						getRowClassName={(row) =>
							row.original.type === "income"
								? "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30"
								: ""
						}
					/>
				</div>
			</Card>

			<Outlet />
		</div>
	);
}
