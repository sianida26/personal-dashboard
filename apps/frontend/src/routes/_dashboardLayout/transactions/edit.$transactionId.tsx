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
import { transactionUpdateSchema } from "@repo/validation";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import { useEffect } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute(
	"/_dashboardLayout/transactions/edit/$transactionId",
)({
	component: RouteComponent,
});

type FormValues = z.infer<typeof transactionUpdateSchema>;

function RouteComponent() {
	const navigate = useNavigate();
	const { transactionId } = Route.useParams();

	const form = useForm<FormValues>({
		validate: zodResolver(transactionUpdateSchema),
		initialValues: {
			amount: undefined,
			categoryId: undefined,
			date: undefined,
			description: undefined,
			tags: undefined,
			attachmentUrl: undefined,
		},
	});

	// Fetch transaction data
	const { data: transactionResponse, isLoading } = useQuery({
		queryKey: ["transaction", transactionId],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.transactions[":id"].$get({
					param: { id: transactionId },
				}),
			);
			return res;
		},
		enabled: !!transactionId,
	});

	const transactionData = transactionResponse?.data;

	// Fetch categories based on transaction type
	const { data: categoriesResponse } = useQuery({
		queryKey: ["categories", transactionData?.type],
		queryFn: async () => {
			if (!transactionData || transactionData.type === "transfer")
				return { data: [] };
			const res = await fetchRPC(
				client.money.categories.$get({
					query: {
						type: transactionData.type,
					},
				}),
			);
			return res;
		},
		enabled: !!transactionData && transactionData.type !== "transfer",
	});

	// Set form values when transaction data is loaded
	useEffect(() => {
		if (transactionData) {
			form.setValues({
				amount: Number(transactionData.amount),
				categoryId: transactionData.categoryId ?? undefined,
				date: transactionData.date
					? new Date(transactionData.date)
					: undefined,
				description: transactionData.description ?? undefined,
				tags: transactionData.tags ?? undefined,
				attachmentUrl: transactionData.attachmentUrl ?? undefined,
			});
		}
	}, [transactionData]);

	const categories = categoriesResponse?.data ?? [];

	if (isLoading) {
		return null;
	}

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={async () => {
				try {
					await fetchRPC(
						client.money.transactions[":id"].$put({
							param: { id: transactionId },
							json: {
								...form.values,
								amount: form.values.amount,
								date: form.values.date,
								categoryId: form.values.categoryId,
								description: form.values.description,
							},
						}),
					);
					toast.success("Transaksi berhasil diperbarui", {
						description: "Perubahan telah disimpan.",
					});
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error
							? error.message
							: "Terjadi kesalahan.";
					toast.error("Gagal memperbarui transaksi", {
						description: errorMessage,
					});
					throw error;
				}
			}}
			title="Edit Transaksi"
			onClose={() => navigate({ to: "/transactions" })}
			onSuccess={() => navigate({ to: "/transactions" })}
			mutationKey={["update-transaction", transactionId]}
			invalidateQueries={["transactions"]}
		>
			<div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
				{/* Transaction Type (read-only) */}
				<div className="space-y-2">
					<Label>Tipe Transaksi</Label>
					<Input
						value={
							transactionData?.type === "income"
								? "Pemasukan"
								: transactionData?.type === "expense"
									? "Pengeluaran"
									: "Transfer"
						}
						disabled
						className="bg-muted"
					/>
				</div>

				{/* Amount */}
				<div className="space-y-2">
					<Label htmlFor="amount">Jumlah</Label>
					<Input
						id="amount"
						type="number"
						placeholder="0"
						value={form.values.amount ?? ""}
						onChange={(e) =>
							form.setFieldValue(
								"amount",
								e.target.value
									? Number(e.target.value)
									: undefined,
							)
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
								: ""
						}
						onChange={(e) =>
							form.setFieldValue(
								"date",
								e.target.value
									? new Date(e.target.value)
									: undefined,
							)
						}
					/>
					{form.errors.date && (
						<p className="text-sm text-destructive">
							{form.errors.date}
						</p>
					)}
				</div>

				{/* Category (for non-transfers) */}
				{transactionData?.type !== "transfer" && (
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
						value={form.values.description ?? ""}
						onChange={(e) =>
							form.setFieldValue(
								"description",
								e.target.value || undefined,
							)
						}
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
