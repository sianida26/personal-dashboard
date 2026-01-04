import { useForm } from "@mantine/form";
import {
	Input,
	Label,
	NativeSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui";
import { categoryCreateSchema } from "@repo/validation";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import { toast } from "sonner";
import type { z } from "zod";
import ModalFormTemplate from "@/components/ModalFormTemplate";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute("/_dashboardLayout/categories/create")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		type: (search.type as "income" | "expense") || "expense",
	}),
});

type FormValues = z.infer<typeof categoryCreateSchema>;

// Common emoji icons for categories
const CATEGORY_ICONS = [
	"🍔",
	"🍕",
	"🍜",
	"☕",
	"🛒",
	"🏠",
	"🚗",
	"⛽",
	"🚌",
	"✈️",
	"💊",
	"🏥",
	"📚",
	"🎓",
	"💼",
	"💰",
	"🎮",
	"🎬",
	"🎵",
	"👕",
	"👟",
	"💄",
	"💇",
	"🎁",
	"❤️",
	"📱",
	"💻",
	"🔌",
	"💡",
	"🔧",
	"🏋️",
	"⚽",
	"🎾",
	"🏊",
	"🎂",
	"🍺",
	"🍷",
	"🚬",
	"💳",
	"🏦",
];

// Common colors for categories
const CATEGORY_COLORS = [
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
	"#ec4899",
	"#f43f5e",
	"#78716c",
	"#64748b",
	"#000000",
];

function RouteComponent() {
	const navigate = useNavigate();
	const { type } = useSearch({ from: "/_dashboardLayout/categories/create" });

	const form = useForm<FormValues>({
		validate: zodResolver(categoryCreateSchema),
		initialValues: {
			name: "",
			type: type,
			icon: undefined,
			color: undefined,
			parentId: undefined,
		},
	});

	// Fetch parent categories (only root categories of same type)
	const { data: categoriesResponse } = useQuery({
		queryKey: ["categories", form.values.type],
		queryFn: async () => {
			const res = await fetchRPC(
				client.money.categories.$get({
					query: { type: form.values.type },
				}),
			);
			return res;
		},
	});

	const parentCategories =
		(categoriesResponse?.data as Array<{
			id: string;
			name: string;
			parentId: string | null;
		}>) ?? [];

	// Filter to only show root categories (no parent)
	const rootCategories = parentCategories.filter((c) => !c.parentId);

	return (
		<ModalFormTemplate
			form={form}
			onSubmit={async () => {
				try {
					await fetchRPC(
						client.money.categories.$post({
							json: {
								...form.values,
								icon: form.values.icon || undefined,
								color: form.values.color || undefined,
								parentId: form.values.parentId || undefined,
							},
						}),
					);
					toast.success("Kategori berhasil dibuat", {
						description: `Kategori "${form.values.name}" telah ditambahkan.`,
					});
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error
							? error.message
							: "Terjadi kesalahan.";
					toast.error("Gagal membuat kategori", {
						description: errorMessage,
					});
					throw error;
				}
			}}
			title="Tambah Kategori"
			onClose={() => navigate({ to: "/categories" })}
			onSuccess={() => navigate({ to: "/categories" })}
			mutationKey={["create-category"]}
			invalidateQueries={["categories"]}
		>
			{/* Name */}
			<div className="space-y-2">
				<Label htmlFor="name">Nama Kategori</Label>
				<Input
					id="name"
					placeholder="Contoh: Makanan"
					{...form.getInputProps("name")}
				/>
				{form.errors.name && (
					<p className="text-sm text-destructive">
						{form.errors.name}
					</p>
				)}
			</div>

			{/* Type */}
			<div className="space-y-2">
				<Label htmlFor="type">Tipe</Label>
				<NativeSelect
					value={form.values.type}
					onValueChange={(value) =>
						form.setFieldValue(
							"type",
							value as "income" | "expense",
						)
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Pilih tipe" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="expense">Pengeluaran</SelectItem>
						<SelectItem value="income">Pemasukan</SelectItem>
					</SelectContent>
				</NativeSelect>
				{form.errors.type && (
					<p className="text-sm text-destructive">
						{form.errors.type}
					</p>
				)}
			</div>

			{/* Parent Category */}
			<div className="space-y-2">
				<Label htmlFor="parentId">Kategori Induk (Opsional)</Label>
				<NativeSelect
					value={form.values.parentId ?? "__none__"}
					onValueChange={(value) =>
						form.setFieldValue(
							"parentId",
							value === "__none__" ? undefined : value,
						)
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Pilih kategori induk" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">
							Tidak ada (Kategori utama)
						</SelectItem>
						{rootCategories.map((category) => (
							<SelectItem key={category.id} value={category.id}>
								{category.name}
							</SelectItem>
						))}
					</SelectContent>
				</NativeSelect>
				{form.errors.parentId && (
					<p className="text-sm text-destructive">
						{form.errors.parentId}
					</p>
				)}
			</div>

			{/* Icon */}
			<div className="space-y-2">
				<Label>Ikon (Opsional)</Label>
				<div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
					{CATEGORY_ICONS.map((icon) => (
						<button
							key={icon}
							type="button"
							onClick={() => form.setFieldValue("icon", icon)}
							className={`w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors ${
								form.values.icon === icon
									? "bg-primary text-primary-foreground"
									: ""
							}`}
						>
							{icon}
						</button>
					))}
				</div>
				{form.values.icon && (
					<div className="flex items-center gap-2">
						<span>Terpilih: {form.values.icon}</span>
						<button
							type="button"
							onClick={() =>
								form.setFieldValue("icon", undefined)
							}
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Hapus
						</button>
					</div>
				)}
			</div>

			{/* Color */}
			<div className="space-y-2">
				<Label>Warna (Opsional)</Label>
				<div className="flex flex-wrap gap-2 p-2 border rounded-lg">
					{CATEGORY_COLORS.map((color) => (
						<button
							key={color}
							type="button"
							onClick={() => form.setFieldValue("color", color)}
							className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
								form.values.color === color
									? "ring-2 ring-offset-2 ring-primary"
									: ""
							}`}
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
				{form.values.color && (
					<div className="flex items-center gap-2">
						<div
							className="w-4 h-4 rounded-full"
							style={{ backgroundColor: form.values.color }}
						/>
						<span>Terpilih: {form.values.color}</span>
						<button
							type="button"
							onClick={() =>
								form.setFieldValue("color", undefined)
							}
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Hapus
						</button>
					</div>
				)}
			</div>
		</ModalFormTemplate>
	);
}
