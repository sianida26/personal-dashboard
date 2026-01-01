import { Badge, Button, Card } from "@repo/ui";
import {
	createLazyFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { TbPencil, TbPlus, TbTrash } from "react-icons/tb";
import type { AdaptiveColumnDef } from "@/components/AdaptiveTable";
import ServerDataTable from "@/components/ServerDataTable";
import client from "@/honoClient";

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
					return new Date(date).toLocaleDateString("id-ID", {
						year: "numeric",
						month: "short",
						day: "numeric",
					});
				},
				sortable: true,
				size: 130,
				minSize: 110,
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
		[navigate],
	);

	return (
		<div className="p-6 h-full flex flex-col overflow-hidden">
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
						<Link to="/transactions/create">
							<Button leftSection={<TbPlus />}>
								Tambah Transaksi
							</Button>
						</Link>
					}
					columnOrderable
					columnResizable
					rowVirtualization
				/>
			</Card>

			<Outlet />
		</div>
	);
}
