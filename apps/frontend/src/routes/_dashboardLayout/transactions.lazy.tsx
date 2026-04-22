import {
	Badge,
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	NativeSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	Link,
	Outlet,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	TbChartBar,
	TbPencil,
	TbPlus,
	TbRefresh,
	TbTrash,
	TbWallet,
} from "react-icons/tb";
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
	type: "income" | "expense" | "transfer" | "reconcile";
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

interface Account {
	id: string;
	name: string;
	type: "cash" | "bank" | "e_wallet" | "credit_card" | "investment";
	balance: string;
	currency: string;
	isActive: boolean;
}

export default function TransactionsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const matches = useMatches();
	const [accountsDialogOpen, setAccountsDialogOpen] = useState(false);
	const [newAccountName, setNewAccountName] = useState("");
	const [newAccountType, setNewAccountType] = useState<
		"cash" | "bank" | "e_wallet" | "credit_card" | "investment"
	>("cash");
	const [newAccountBalance, setNewAccountBalance] = useState("0");
	const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
	const [reconcileAccount, setReconcileAccount] = useState<Account | null>(null);
	const [reconcileActualBalance, setReconcileActualBalance] = useState("");

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
	const { data: allAccountsResponse } = useQuery({
		queryKey: ["accounts", "all"],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.accounts.$get({
					query: { includeInactive: "true" },
				}),
			);
			return res;
		},
	});

	const categories = categoriesResponse?.data ?? [];
	const accounts = accountsResponse?.data ?? [];
	const allAccounts = (allAccountsResponse?.data as Account[]) ?? [];

	const createAccountMutation = useMutation({
		mutationKey: ["create-account"],
		mutationFn: async () => {
			await fetchRPC(
				client.money.accounts.$post({
					json: {
						name: newAccountName,
						type: newAccountType,
						balance: Number(newAccountBalance || 0),
						currency: "IDR",
					},
				}),
			);
		},
		onSuccess: () => {
			toast.success("Akun berhasil dibuat");
			setNewAccountName("");
			setNewAccountType("cash");
			setNewAccountBalance("0");
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
		onError: (error) => {
			toast.error("Gagal membuat akun", {
				description:
					error instanceof Error ? error.message : "Terjadi kesalahan.",
			});
		},
	});

	const toggleAccountMutation = useMutation({
		mutationKey: ["toggle-account-status"],
		mutationFn: async ({
			id,
			isActive,
		}: {
			id: string;
			isActive: boolean;
		}) => {
			await fetchRPC(
				client.money.accounts[":id"].$put({
					param: { id },
					json: { isActive: !isActive },
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
		onError: (error) => {
			toast.error("Gagal mengubah status akun", {
				description:
					error instanceof Error ? error.message : "Terjadi kesalahan.",
			});
		},
	});

	const reconcileAccountMutation = useMutation({
		mutationKey: ["reconcile-account"],
		mutationFn: async ({
			accountId,
			actualBalance,
		}: {
			accountId: string;
			actualBalance: number;
		}) => {
			return fetchRPC<{
				data: {
					noOp: boolean;
					message?: string;
					accountId: string;
					accountBalance: number;
					systemBalance: number;
					actualBalance: number;
					delta: number;
					transaction: { id: string; type: string } | null;
				};
			}>(
				client.money.accounts[":id"].reconcile.$post({
					param: { id: accountId },
					json: { actualBalance },
				}),
			);
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			queryClient.invalidateQueries({ queryKey: ["accounts", "all"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			if (result?.data?.noOp) {
				toast.success("Saldo sudah sinkron, tidak ada perubahan.");
			} else {
				toast.success("Rekonsiliasi berhasil disimpan.");
			}
			setReconcileDialogOpen(false);
			setReconcileAccount(null);
			setReconcileActualBalance("");
		},
		onError: (error) => {
			toast.error("Gagal melakukan rekonsiliasi", {
				description:
					error instanceof Error ? error.message : "Terjadi kesalahan.",
			});
		},
	});

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
						reconcile: {
							label: "Rekonsiliasi",
							className: "bg-amber-100 text-amber-700",
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
					{ label: "Rekonsiliasi", value: "reconcile" },
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
					const isNegative =
						row.type === "expense" ||
						(row.type === "reconcile" && amount < 0);
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
								<Button
									variant="outline"
									leftSection={<TbWallet />}
									onClick={() =>
										setAccountsDialogOpen(true)
									}
								>
									Kelola Akun
								</Button>
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

			<Dialog
				open={accountsDialogOpen}
				onOpenChange={setAccountsDialogOpen}
			>
				<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Kelola Akun</DialogTitle>
						<DialogDescription>
							Tambah akun sumber dana, termasuk akun paylater
							dan pinjaman.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 p-3 border rounded-lg bg-muted/30">
						<p className="text-sm font-medium">Tambah Akun Baru</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
							<div className="space-y-1">
								<Label htmlFor="new-account-name">Nama</Label>
								<Input
									id="new-account-name"
									placeholder="Contoh: BCA Chesa"
									value={newAccountName}
									onChange={(e) =>
										setNewAccountName(e.target.value)
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="new-account-type">Tipe</Label>
								<NativeSelect
									value={newAccountType}
									onValueChange={(value) =>
										setNewAccountType(
											value as
												| "cash"
												| "bank"
												| "e_wallet"
												| "credit_card"
												| "investment",
										)
									}
								>
									<SelectTrigger id="new-account-type">
										<SelectValue placeholder="Pilih tipe" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="cash">
											Cash
										</SelectItem>
										<SelectItem value="bank">
											Bank
										</SelectItem>
										<SelectItem value="e_wallet">
											E-Wallet
										</SelectItem>
										<SelectItem value="credit_card">
											Credit/Paylater
										</SelectItem>
										<SelectItem value="investment">
											Investment
										</SelectItem>
									</SelectContent>
								</NativeSelect>
							</div>
							<div className="space-y-1">
								<Label htmlFor="new-account-balance">
									Saldo Awal
								</Label>
								<Input
									id="new-account-balance"
									type="number"
									value={newAccountBalance}
									onChange={(e) =>
										setNewAccountBalance(e.target.value)
									}
								/>
							</div>
						</div>
						<Button
							onClick={() => createAccountMutation.mutate()}
							disabled={
								createAccountMutation.isPending ||
								!newAccountName.trim()
							}
							leftSection={<TbPlus />}
						>
							{createAccountMutation.isPending
								? "Menyimpan..."
								: "Tambah Akun"}
						</Button>
					</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Daftar Akun</p>
						<div className="space-y-2">
							{allAccounts.length === 0 && (
								<div className="text-sm text-muted-foreground border rounded-lg p-3">
									Belum ada akun.
								</div>
							)}
							{allAccounts.map((account) => (
								<div
									key={account.id}
									className="flex items-center justify-between border rounded-lg p-3"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<p className="font-medium">
												{account.name}
											</p>
											<Badge variant="outline">
												{account.type}
											</Badge>
											{!account.isActive && (
												<Badge variant="secondary">
													Nonaktif
												</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{new Intl.NumberFormat("id-ID", {
												style: "currency",
												currency:
													account.currency || "IDR",
												maximumFractionDigits: 0,
											}).format(
												Number(account.balance || 0),
											)}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											leftSection={<TbRefresh />}
											onClick={() => {
												setReconcileAccount(account);
												setReconcileActualBalance(
													String(
														Number(
															account.balance || 0,
														),
													),
												);
												setReconcileDialogOpen(true);
											}}
											disabled={!account.isActive}
										>
											Rekonsiliasi
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												toggleAccountMutation.mutate({
													id: account.id,
													isActive: account.isActive,
												})
											}
											disabled={
												toggleAccountMutation.isPending
											}
										>
											{account.isActive
												? "Nonaktifkan"
												: "Aktifkan"}
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={reconcileDialogOpen}
				onOpenChange={(open) => {
					setReconcileDialogOpen(open);
					if (!open) {
						setReconcileAccount(null);
						setReconcileActualBalance("");
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Rekonsiliasi Saldo</DialogTitle>
						<DialogDescription>
							Sinkronkan saldo akun dengan saldo aktual.
						</DialogDescription>
					</DialogHeader>
					{reconcileAccount && (
						<div className="space-y-4">
							<div className="rounded-lg border p-3 space-y-2">
								<p className="text-sm text-muted-foreground">
									Akun
								</p>
								<p className="font-medium">
									{reconcileAccount.name}
								</p>
								<p className="text-sm text-muted-foreground">
									Saldo Sistem:{" "}
									{new Intl.NumberFormat("id-ID", {
										style: "currency",
										currency:
											reconcileAccount.currency || "IDR",
										maximumFractionDigits: 0,
									}).format(
										Number(reconcileAccount.balance || 0),
									)}
								</p>
							</div>

							<div className="space-y-1">
								<Label htmlFor="actual-balance">
									Saldo Aktual
								</Label>
								<Input
									id="actual-balance"
									type="number"
									value={reconcileActualBalance}
									onChange={(e) =>
										setReconcileActualBalance(
											e.target.value,
										)
									}
								/>
							</div>

							<div className="rounded-lg border p-3 text-sm">
								{(() => {
									const system = Number(
										reconcileAccount.balance || 0,
									);
									const actual = Number(
										reconcileActualBalance || 0,
									);
									const delta = actual - system;
									const deltaLabel = new Intl.NumberFormat(
										"id-ID",
										{
											style: "currency",
											currency:
												reconcileAccount.currency ||
												"IDR",
											maximumFractionDigits: 0,
										},
									).format(delta);
									return (
										<p>
											Selisih:{" "}
											<span
												className={
													delta > 0
														? "text-green-700 font-medium"
														: delta < 0
															? "text-red-700 font-medium"
															: "text-muted-foreground font-medium"
												}
											>
												{deltaLabel}
											</span>
										</p>
									);
								})()}
							</div>

							<Button
								className="w-full"
								leftSection={<TbRefresh />}
								disabled={
									reconcileAccountMutation.isPending ||
									reconcileActualBalance.trim() === ""
								}
								onClick={() => {
									if (!reconcileAccount) return;
									reconcileAccountMutation.mutate({
										accountId: reconcileAccount.id,
										actualBalance: Number(
											reconcileActualBalance,
										),
									});
								}}
							>
								{reconcileAccountMutation.isPending
									? "Menyimpan..."
									: "Simpan Rekonsiliasi"}
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
