import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { TbArrowLeft, TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import type { AdaptiveColumnDef } from "@/components/AdaptiveTable";
import { ServerDataTable } from "@/components/ServerDataTable";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute(
	"/_dashboardLayout/categories/view/$categoryId",
)({
	component: RouteComponent,
});

// Transaction type (similar to transactions page)
interface Transaction {
	id: string;
	userId: string;
	accountId: string;
	categoryId: string | null;
	type: "income" | "expense" | "transfer";
	amount: string;
	description: string | null;
	date: string;
	toAccountId: string | null;
	source: "manual" | "import";
	tags: string[] | null;
	labels: string[] | null;
	attachmentUrl: string | null;
	waMessageId: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	account: {
		id: string;
		name: string;
		type: string;
		icon: string | null;
		color: string | null;
	};
	category: {
		id: string;
		name: string;
		type: string;
		icon: string | null;
		color: string | null;
	} | null;
	toAccount: {
		id: string;
		name: string;
		type: string;
		icon: string | null;
		color: string | null;
	} | null;
}

function RouteComponent() {
	const navigate = useNavigate();
	const { categoryId } = useParams({
		from: "/_dashboardLayout/categories/view/$categoryId",
	});

	// Fetch current category data
	const { data: categoryResponse, isLoading: categoryLoading } = useQuery({
		queryKey: ["category", categoryId],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.categories[":id"].$get({
					param: { id: categoryId },
				}),
			);
			return res;
		},
	});

	const category = categoryResponse?.data;

	// Column definitions for transactions
	const columns = useMemo<AdaptiveColumnDef<Transaction>[]>(
		() => [
			{
				id: "rowNumber",
				header: "#",
				cell: ({ row }) => row.index + 1,
				size: 60,
				minSize: 60,
				maxSize: 80,
				enableSorting: false,
				filterable: false,
				resizable: false,
			},
			{
				accessorKey: "date",
				header: "Tanggal",
				cell: (info) => {
					const date = info.getValue() as string;
					return new Date(date).toLocaleString("id-ID", {
						year: "numeric",
						month: "short",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					});
				},
				sortable: true,
				size: 160,
				minSize: 140,
			},
			{
				accessorKey: "type",
				header: "Tipe",
				cell: (info) => {
					const type = info.getValue() as string;
					const typeMap = {
						income: {
							label: "Pemasukan",
							className: "bg-green-100 text-green-700",
						},
						expense: {
							label: "Pengeluaran",
							className: "bg-red-100 text-red-700",
						},
						transfer: {
							label: "Transfer",
							className: "bg-blue-100 text-blue-700",
						},
					};
					const config = typeMap[type as keyof typeof typeMap];
					return (
						<Badge className={config?.className}>
							{config?.label || type}
						</Badge>
					);
				},
				filterType: "select",
				options: [
					{ label: "Pemasukan", value: "income" },
					{ label: "Pengeluaran", value: "expense" },
					{ label: "Transfer", value: "transfer" },
				],
				sortable: true,
				size: 120,
				minSize: 100,
			},
			{
				accessorKey: "description",
				header: "Deskripsi",
				cell: (info) => {
					const description = info.getValue() as string | null;
					return (
						description || <span className="text-gray-400">-</span>
					);
				},
				sortable: true,
				size: 200,
				minSize: 150,
			},
			{
				accessorKey: "amount",
				header: "Jumlah",
				cell: (info) => {
					const row = info.row.original;
					const amount = Number(info.getValue());
					const isNegative = row.type === "expense";
					return (
						<span
							className={
								isNegative ? "text-red-600" : "text-green-600"
							}
						>
							{isNegative ? "-" : "+"}
							{new Intl.NumberFormat("id-ID", {
								style: "currency",
								currency: "IDR",
								minimumFractionDigits: 0,
							}).format(amount)}
						</span>
					);
				},
				sortable: true,
				size: 150,
				minSize: 120,
			},
			{
				id: "account",
				header: "Akun",
				cell: ({ row }) => row.original.account?.name || "-",
				filterable: false,
				enableSorting: false,
				size: 130,
				minSize: 100,
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<Link
							to="/transactions/edit/$transactionId"
							params={{ transactionId: row.original.id }}
						>
							<Button size="sm" variant="ghost">
								<TbPencil className="h-4 w-4" />
							</Button>
						</Link>
						<Link
							to="/transactions/delete/$transactionId"
							params={{ transactionId: row.original.id }}
						>
							<Button
								size="sm"
								variant="ghost"
								className="text-destructive"
							>
								<TbTrash className="h-4 w-4" />
							</Button>
						</Link>
					</div>
				),
				size: 100,
				minSize: 80,
				enableSorting: false,
				filterable: false,
			},
		],
		[],
	);

	if (categoryLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (!category) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-4">
				<p className="text-muted-foreground">
					Kategori tidak ditemukan
				</p>
				<Button asChild variant="outline">
					<Link to="/categories">
						<TbArrowLeft className="mr-2 h-4 w-4" />
						Kembali ke Kategori
					</Link>
				</Button>
			</div>
		);
	}

	// Calculate total for display
	const typeLabel = category.type === "income" ? "Pemasukan" : "Pengeluaran";

	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-y-auto">
				<div className="p-6 space-y-6">
					{/* Header */}
					<div className="flex items-center gap-4 flex-wrap">
						<Button asChild variant="ghost" size="icon">
							<Link to="/categories">
								<TbArrowLeft className="h-5 w-5" />
							</Link>
						</Button>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-3">
								{category.icon && (
									<span className="text-3xl flex-shrink-0">
										{category.icon}
									</span>
								)}
								<div className="min-w-0">
									<h1 className="text-2xl font-bold">
										{category.name}
									</h1>
									<Badge
										className={
											category.type === "income"
												? "bg-green-100 text-green-700"
												: "bg-red-100 text-red-700"
										}
									>
										{typeLabel}
									</Badge>
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2 flex-shrink-0">
							<Button
								variant="outline"
								onClick={() =>
									navigate({
										to: "/categories/edit/$categoryId",
										params: { categoryId },
									})
								}
							>
								<TbPencil className="mr-2 h-4 w-4" />
								Edit
							</Button>
							<Button
								variant="destructive"
								onClick={() =>
									navigate({
										to: "/categories/delete/$categoryId",
										params: { categoryId },
									})
								}
							>
								<TbTrash className="mr-2 h-4 w-4" />
								Hapus
							</Button>
						</div>
					</div>

					{/* Category Details Card */}
					<Card>
						<CardHeader>
							<CardTitle>Detail Kategori</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">
										Nama
									</p>
									<p className="font-medium">
										{category.name}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Tipe
									</p>
									<p className="font-medium">{typeLabel}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Ikon
									</p>
									<p className="font-medium">
										{category.icon || "-"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Warna
									</p>
									<div className="flex items-center gap-2">
										{category.color ? (
											<>
												<div
													className="w-4 h-4 rounded-full"
													style={{
														backgroundColor:
															category.color,
													}}
												/>
												<span className="font-medium">
													{category.color}
												</span>
											</>
										) : (
											<span className="font-medium">
												-
											</span>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Transactions Table */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Transaksi dengan Kategori Ini</CardTitle>
							<Button asChild size="sm">
								<Link to="/transactions/create">
									<TbPlus className="mr-2 h-4 w-4" />
									Tambah Transaksi
								</Link>
							</Button>
						</CardHeader>
						<CardContent>
							<ServerDataTable<Transaction>
								columns={columns}
								queryKey={[
									"transactions",
									"category",
									categoryId,
								]}
								endpoint={client.money.transactions.$get}
								additionalParams={{ categoryId }}
								search
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
