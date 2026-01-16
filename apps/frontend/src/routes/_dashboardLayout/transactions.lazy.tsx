import { Badge, Button, Card } from "@repo/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	Link,
	Outlet,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { TbChartBar, TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import type { AdaptiveColumnDef } from "@/components/AdaptiveTable";
import ServerDataTable from "@/components/ServerDataTable";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createLazyFileRoute("/_dashboardLayout/transactions")({
	component: TransactionsPage,
});

// Define the Transaction type based on API response
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

export default function TransactionsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const matches = useMatches();

	// Check if we're on a child route (analytics, create, edit, delete)
	const isChildRoute = matches.some(
		(match) =>
			match.pathname !== "/transactions" &&
			match.pathname.startsWith("/transactions"),
	);

	// Fetch categories
	const { data: categoriesResponse } = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.categories.$get({
					query: {},
				}),
			);
			return res;
		},
	});

	// Fetch accounts
	const { data: accountsResponse } = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.accounts.$get({
					query: {},
				}),
			);
			return res;
		},
	});

	const categories = categoriesResponse?.data ?? [];
	const accounts = accountsResponse?.data ?? [];

	// Handler untuk update transaksi
	const handleUpdateTransaction = async (
		transactionId: string,
		field: string,
		value: unknown,
	) => {
		try {
			// Prepare update payload
			const payload: Record<string, unknown> = {
				[field]: value,
			};

			// Update transaction via API
			await fetchRPC(
				client.money.transactions[":id"].$put({
					param: { id: transactionId },
					json: payload as never,
				}),
			);

			// Invalidate queries to refetch data
			queryClient.invalidateQueries({ queryKey: ["transactions"] });

			toast.success("Transaksi berhasil diperbarui");
		} catch (error) {
			console.error("Failed to update transaction:", error);
			toast.error("Gagal memperbarui transaksi");
		}
	};

	// Column definitions
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
						<Badge className={config.className}>
							{config.label}
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
				editable: true,
				editType: "text",
				onEdited: (_rowIndex, _columnId, value, rowData) => {
					if (rowData) {
						handleUpdateTransaction(
							rowData.id,
							"description",
							value,
						);
					}
				},
			},
			{
				accessorKey: "labels",
				header: "Label",
				cell: (info) => {
					const labels = info.getValue() as string[] | null;
					if (!labels || labels.length === 0) {
						return <span className="text-gray-400">-</span>;
					}
					return (
						<div className="flex flex-wrap gap-1">
							{labels.map((label, index) => (
								<Badge
									key={index}
									variant="outline"
									className="text-xs"
								>
									{label}
								</Badge>
							))}
						</div>
					);
				},
				sortable: false,
				size: 180,
				minSize: 150,
				enableHiding: true,
			},
			{
				id: "category",
				header: "Kategori",
				cell: ({ row }) => {
					const category = row.original.category;
					if (!category) {
						return <span className="text-gray-400">-</span>;
					}
					return (
						<div className="flex items-center gap-2">
							{category.icon && <span>{category.icon}</span>}
							<span>{category.name}</span>
						</div>
					);
				},
				filterable: false,
				enableSorting: false,
				size: 150,
				minSize: 120,
				editable: true,
				editType: "select",
				accessorFn: (row) => row.category?.id,
				options: categories.map(
					(cat: {
						id: string;
						name: string;
						icon: string | null;
					}) => ({
						label: cat.name,
						value: cat.id,
					}),
				),
				customOptionComponent: (option) => {
					const category = categories.find(
						(c: { id: string }) => c.id === option.value,
					);
					return (
						<div className="flex items-center gap-2">
							{category?.icon && <span>{category.icon}</span>}
							<span>{option.label}</span>
						</div>
					);
				},
				onEdited: (_rowIndex, _columnId, value, rowData) => {
					if (rowData) {
						handleUpdateTransaction(
							rowData.id,
							"categoryId",
							value,
						);
					}
				},
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
				editable: true,
				editType: "select",
				accessorFn: (row) => row.account?.id,
				options: accounts.map((acc: { id: string; name: string }) => ({
					label: acc.name,
					value: acc.id,
				})),
				onEdited: (_rowIndex, _columnId, value, rowData) => {
					if (rowData) {
						handleUpdateTransaction(rowData.id, "accountId", value);
					}
				},
			},
			{
				accessorKey: "source",
				header: "Sumber",
				cell: (info) => {
					const source = info.getValue() as string;
					return (
						<Badge variant="outline" className="text-xs">
							{source === "manual" ? "Manual" : "Import"}
						</Badge>
					);
				},
				filterType: "select",
				options: [
					{ label: "Manual", value: "manual" },
					{ label: "Import", value: "import" },
				],
				sortable: false,
				size: 100,
				minSize: 80,
				enableHiding: true,
			},
			{
				id: "actions",
				header: "Aksi",
				size: 100,
				minSize: 100,
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							size="icon"
							variant="ghost"
							onClick={(e) => {
								e.stopPropagation();
								navigate({
									to: "/transactions/edit/$transactionId",
									params: { transactionId: row.original.id },
								});
							}}
						>
							<TbPencil />
						</Button>
						<Button
							size="icon"
							variant="ghost"
							className="text-destructive hover:text-destructive"
							onClick={(e) => {
								e.stopPropagation();
								navigate({
									to: "/transactions/delete/$transactionId",
									params: { transactionId: row.original.id },
								});
							}}
						>
							<TbTrash />
						</Button>
					</div>
				),
			},
		],
		[navigate, categories, accounts, queryClient],
	);

	return (
		<div className="p-6 h-full flex flex-col overflow-hidden">
			{!isChildRoute && (
				<Card className="flex-1 p-6 flex flex-col overflow-hidden">
					<ServerDataTable
						columns={columns}
						endpoint={client.money.transactions.$get}
						queryKey={["transactions"]}
						title="Transaksi"
						saveState="transactions-table"
						initialState={{
							columnVisibility: {
								source: false,
							},
							sorting: [{ id: "date", desc: true }],
						}}
						headerActions={
							<div className="flex gap-2">
								<Link to="/transactions/analytics">
									<Button
										variant="outline"
										leftSection={<TbChartBar />}
									>
										Analisis
									</Button>
								</Link>
								<Link to="/transactions/create">
									<Button leftSection={<TbPlus />}>
										Tambah Transaksi
									</Button>
								</Link>
							</div>
						}
						columnOrderable
						columnResizable
						rowVirtualization
					/>
				</Card>
			)}

			<Outlet />
		</div>
	);
}
