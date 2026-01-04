import {
	Badge,
	Button,
	Card,
	TabList,
	TabPanel,
	Tabs,
	TabTrigger,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	TbChevronRight,
	TbFolder,
	TbFolderOpen,
	TbPencil,
	TbPlus,
	TbTrash,
} from "react-icons/tb";
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

function CategoryItem({
	category,
	level = 0,
	onEdit,
	onDelete,
	onView,
}: {
	category: Category;
	level?: number;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onView: (id: string) => void;
}) {
	const [expanded, setExpanded] = useState(true);
	const hasChildren = category.children && category.children.length > 0;

	return (
		<div>
			<button
				type="button"
				className={`flex items-center gap-2 p-3 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer group w-full text-left ${
					level > 0 ? "ml-6" : ""
				}`}
				onClick={() => onView(category.id)}
			>
				{/* Expand/Collapse button */}
				<div className="w-6 flex justify-center">
					{hasChildren ? (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setExpanded(!expanded);
							}}
							className="p-0.5 hover:bg-accent rounded"
						>
							<TbChevronRight
								className={`h-4 w-4 transition-transform ${
									expanded ? "rotate-90" : ""
								}`}
							/>
						</button>
					) : (
						<div className="w-4" />
					)}
				</div>

				{/* Icon */}
				<div
					className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
					style={{
						backgroundColor: category.color
							? `${category.color}20`
							: "var(--accent)",
						color: category.color || "inherit",
					}}
				>
					{category.icon ||
						(hasChildren ? <TbFolderOpen /> : <TbFolder />)}
				</div>

				{/* Name & Stats */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium truncate">
							{category.name}
						</span>
						{!category.isActive && (
							<Badge variant="outline" className="text-xs">
								Nonaktif
							</Badge>
						)}
					</div>
					<div className="text-xs text-muted-foreground">
						{category.transactionCount} transaksi
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						size="icon"
						variant="ghost"
						className="h-8 w-8"
						onClick={(e) => {
							e.stopPropagation();
							onEdit(category.id);
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
							onDelete(category.id);
						}}
					>
						<TbTrash className="h-4 w-4" />
					</Button>
				</div>
			</button>

			{/* Children */}
			{hasChildren && expanded && (
				<div className="border-l-2 border-border ml-6">
					{category.children?.map((child) => (
						<CategoryItem
							key={child.id}
							category={child}
							level={level + 1}
							onEdit={onEdit}
							onDelete={onDelete}
							onView={onView}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function CategoryList({
	categories,
	type,
	onEdit,
	onDelete,
	onView,
}: {
	categories: Category[];
	type: "income" | "expense";
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onView: (id: string) => void;
}) {
	// Build tree structure
	const tree = useMemo(() => {
		const categoryMap = new Map<string, Category>();
		const rootCategories: Category[] = [];

		// Filter by type
		const filteredCategories = categories.filter((c) => c.type === type);

		// First pass: create map
		for (const cat of filteredCategories) {
			categoryMap.set(cat.id, { ...cat, children: [] });
		}

		// Second pass: build tree
		for (const cat of filteredCategories) {
			const category = categoryMap.get(cat.id);
			if (!category) continue;

			if (cat.parentId && categoryMap.has(cat.parentId)) {
				const parent = categoryMap.get(cat.parentId);
				parent?.children?.push(category);
			} else {
				rootCategories.push(category);
			}
		}

		return rootCategories;
	}, [categories, type]);

	if (tree.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<TbFolder className="h-12 w-12 mx-auto mb-4 opacity-50" />
				<p>
					Belum ada kategori{" "}
					{type === "income" ? "pemasukan" : "pengeluaran"}
				</p>
				<p className="text-sm">
					Klik tombol "Tambah Kategori" untuk membuat kategori baru
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			{tree.map((category) => (
				<CategoryItem
					key={category.id}
					category={category}
					onEdit={onEdit}
					onDelete={onDelete}
					onView={onView}
				/>
			))}
		</div>
	);
}

export default function CategoriesPage() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

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

	const handleView = (id: string) => {
		navigate({
			to: "/categories/view/$categoryId",
			params: { categoryId: id },
		});
	};

	// Count categories by type
	const expenseCount = categories.filter((c) => c.type === "expense").length;
	const incomeCount = categories.filter((c) => c.type === "income").length;

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
					<Link to="/categories/create" search={{ type: activeTab }}>
						<Button leftSection={<TbPlus />}>
							Tambah Kategori
						</Button>
					</Link>
				</div>

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={(v) =>
						setActiveTab(v as "expense" | "income")
					}
					className="flex-1 flex flex-col overflow-hidden"
				>
					<TabList className="mb-4">
						<TabTrigger value="expense" className="gap-2">
							Pengeluaran
							<Badge variant="secondary" className="ml-1">
								{expenseCount}
							</Badge>
						</TabTrigger>
						<TabTrigger value="income" className="gap-2">
							Pemasukan
							<Badge variant="secondary" className="ml-1">
								{incomeCount}
							</Badge>
						</TabTrigger>
					</TabList>

					<div className="flex-1 overflow-auto">
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
							</div>
						) : (
							<>
								<TabPanel value="expense" className="mt-0">
									<CategoryList
										categories={categories}
										type="expense"
										onEdit={handleEdit}
										onDelete={handleDelete}
										onView={handleView}
									/>
								</TabPanel>
								<TabPanel value="income" className="mt-0">
									<CategoryList
										categories={categories}
										type="income"
										onEdit={handleEdit}
										onDelete={handleDelete}
										onView={handleView}
									/>
								</TabPanel>
							</>
						)}
					</div>
				</Tabs>
			</Card>

			<Outlet />
		</div>
	);
}
