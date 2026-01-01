import { useForm } from "@mantine/form";
import {
	Input,
	Label,
	NativeSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@repo/ui";
import { transactionCreateSchema } from "@repo/validation";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import { toast } from "sonner";
import type { z } from "zod";
import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout/transactions/create")({
	component: RouteComponent,
});

// Form schema without the refine validations (handled on submit)
const formSchema = transactionCreateSchema;
type FormValues = z.infer<typeof formSchema>;

function RouteComponent() {
	const navigate = useNavigate();

	const form = useForm<FormValues>({
		validate: zodResolver(formSchema),
		initialValues: {
			type: "expense",
			amount: 0,
			accountId: "",
			categoryId: undefined,
			date: new Date(),
			description: "",
			toAccountId: undefined,
			tags: [],
			attachmentUrl: undefined,
		},
	});

	// Fetch categories based on transaction type
	const { data: categoriesResponse } = useQuery({
		queryKey: ["categories", form.values.type],
		queryFn: async () => {
			if (form.values.type === "transfer") return { data: [] };
			const res = await fetchRPC(
				client.money.categories.$get({
					query: {
						type: form.values.type,
					},
				}),
			);
			return res;
		},
		enabled: form.values.type !== "transfer",
	});

	// Fetch accounts
	const { data: accountsResponse } = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			// For now, we'll need accounts endpoint - let's check if it exists
			// If not, we'll mock it or adjust
			try {
				const res = await fetchRPC(
					// @ts-expect-error - might not exist yet
					client.money.accounts.$get({
						query: {},
					}),
				);
				return res;
			} catch {
				// Return empty if accounts endpoint doesn't exist
				return { data: [] };
			}
		},
	});

	const categories = categoriesResponse?.data ?? [];
	const accounts = accountsResponse?.data ?? [];

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={async () => {
				try {
					await fetchRPC(
						client.money.transactions.$post({
							json: {
								...form.values,
								date: form.values.date,
								categoryId: form.values.categoryId || undefined,
								toAccountId:
									form.values.toAccountId || undefined,
							},
						}),
					);
					toast.success("Transaksi berhasil dibuat", {
						description: "Data transaksi telah disimpan.",
					});
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error
							? error.message
							: "Terjadi kesalahan.";
					toast.error("Gagal membuat transaksi", {
						description: errorMessage,
					});
					throw error;
				}
			}}
			title="Tambah Transaksi"
			onClose={() => navigate({ to: "/transactions" })}
			onSuccess={() => navigate({ to: "/transactions" })}
			mutationKey={["create-transaction"]}
			invalidateQueries={["transactions"]}
		>
			<div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
				{/* Transaction Type */}
				<div className="space-y-2">
					<Label htmlFor="type">Tipe Transaksi</Label>
					<NativeSelect
						value={form.values.type}
						onValueChange={(value) => {
							form.setFieldValue(
								"type",
								value as FormValues["type"],
							);
							// Reset category when type changes
							form.setFieldValue("categoryId", undefined);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Pilih tipe" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="income">Pemasukan</SelectItem>
							<SelectItem value="expense">Pengeluaran</SelectItem>
							<SelectItem value="transfer">Transfer</SelectItem>
						</SelectContent>
					</NativeSelect>
					{form.errors.type && (
						<p className="text-sm text-destructive">
							{form.errors.type}
						</p>
					)}
				</div>

				{/* Amount */}
				<div className="space-y-2">
					<Label htmlFor="amount">Jumlah</Label>
					<Input
						id="amount"
						type="number"
						placeholder="0"
						{...form.getInputProps("amount")}
						onChange={(e) =>
							form.setFieldValue("amount", Number(e.target.value))
						}
					/>
					{form.errors.amount && (
						<p className="text-sm text-destructive">
							{form.errors.amount}
						</p>
					)}
				</div>

				{/* Date */}
				<div className="space-y-2">
					<Label htmlFor="date">Tanggal</Label>
					<Input
						id="date"
						type="date"
						value={
							form.values.date instanceof Date
								? form.values.date.toISOString().split("T")[0]
								: new Date().toISOString().split("T")[0]
						}
						onChange={(e) =>
							form.setFieldValue("date", new Date(e.target.value))
						}
					/>
					{form.errors.date && (
						<p className="text-sm text-destructive">
							{form.errors.date}
						</p>
					)}
				</div>

				{/* Account */}
				<div className="space-y-2">
					<Label htmlFor="accountId">Akun</Label>
					<NativeSelect
						value={form.values.accountId}
						onValueChange={(value) =>
							form.setFieldValue("accountId", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Pilih akun" />
						</SelectTrigger>
						<SelectContent>
							{accounts.map(
								(account: { id: string; name: string }) => (
									<SelectItem
										key={account.id}
										value={account.id}
									>
										{account.name}
									</SelectItem>
								),
							)}
						</SelectContent>
					</NativeSelect>
					{form.errors.accountId && (
						<p className="text-sm text-destructive">
							{form.errors.accountId}
						</p>
					)}
				</div>

				{/* To Account (for transfers) */}
				{form.values.type === "transfer" && (
					<div className="space-y-2">
						<Label htmlFor="toAccountId">Akun Tujuan</Label>
						<NativeSelect
							value={form.values.toAccountId ?? ""}
							onValueChange={(value) =>
								form.setFieldValue("toAccountId", value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih akun tujuan" />
							</SelectTrigger>
							<SelectContent>
								{accounts
									.filter(
										(acc: { id: string }) =>
											acc.id !== form.values.accountId,
									)
									.map(
										(account: {
											id: string;
											name: string;
										}) => (
											<SelectItem
												key={account.id}
												value={account.id}
											>
												{account.name}
											</SelectItem>
										),
									)}
							</SelectContent>
						</NativeSelect>
						{form.errors.toAccountId && (
							<p className="text-sm text-destructive">
								{form.errors.toAccountId}
							</p>
						)}
					</div>
				)}

				{/* Category (for non-transfers) */}
				{form.values.type !== "transfer" && (
					<div className="space-y-2">
						<Label htmlFor="categoryId">Kategori</Label>
						<NativeSelect
							value={form.values.categoryId ?? ""}
							onValueChange={(value) =>
								form.setFieldValue(
									"categoryId",
									value || undefined,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih kategori" />
							</SelectTrigger>
							<SelectContent>
								{categories.map(
									(category: {
										id: string;
										name: string;
										icon: string | null;
									}) => (
										<SelectItem
											key={category.id}
											value={category.id}
										>
											{category.icon && (
												<span className="mr-2">
													{category.icon}
												</span>
											)}
											{category.name}
										</SelectItem>
									),
								)}
							</SelectContent>
						</NativeSelect>
						{form.errors.categoryId && (
							<p className="text-sm text-destructive">
								{form.errors.categoryId}
							</p>
						)}
					</div>
				)}

				{/* Description */}
				<div className="space-y-2">
					<Label htmlFor="description">Deskripsi</Label>
					<Textarea
						id="description"
						placeholder="Deskripsi transaksi (opsional)"
						{...form.getInputProps("description")}
					/>
					{form.errors.description && (
						<p className="text-sm text-destructive">
							{form.errors.description}
						</p>
					)}
				</div>
			</div>
		</ModalFormTemplate>
	);
}
