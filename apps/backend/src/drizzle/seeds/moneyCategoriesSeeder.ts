import { sql } from "drizzle-orm";
import db from "..";
import { moneyCategories } from "../schema/moneyCategories";

interface CategorySeed {
	name: string;
	type: "income" | "expense";
	description?: string;
	group?: string;
	icon?: string;
	color?: string;
}

const categoriesSeedData: CategorySeed[] = [
	// ========== INCOME CATEGORIES ==========
	// Group: Penghasilan Utama
	{
		name: "Gaji",
		type: "income",
		description: "Penghasilan dari pekerjaan tetap",
		group: "Penghasilan Utama",
		icon: "💼",
		color: "#10b981",
	},
	{
		name: "Freelance",
		type: "income",
		description: "Penghasilan dari pekerjaan lepas atau project",
		group: "Penghasilan Utama",
		icon: "💻",
		color: "#10b981",
	},
	{
		name: "Penjualan",
		type: "income",
		description: "Penghasilan dari penjualan barang atau jasa",
		group: "Penghasilan Utama",
		icon: "🛒",
		color: "#10b981",
	},

	// Group: Penghasilan Tambahan
	{
		name: "Sangu",
		type: "income",
		description: "Uang saku atau tunjangan",
		group: "Penghasilan Tambahan",
		icon: "👨‍👩‍👧",
		color: "#34d399",
	},
	{
		name: "Hadiah",
		type: "income",
		description: "Uang hadiah atau pemberian",
		group: "Penghasilan Tambahan",
		icon: "🎁",
		color: "#34d399",
	},
	{
		name: "Refund",
		type: "income",
		description: "Pengembalian dana pembelian atau pembayaran",
		group: "Penghasilan Tambahan",
		icon: "↩️",
		color: "#34d399",
	},

	// Group: Penerimaan Dana
	{
		name: "Paylater",
		type: "income",
		description: "Penerimaan dana dari layanan paylater",
		group: "Penerimaan Dana",
		icon: "💳",
		color: "#6ee7b7",
	},
	{
		name: "Hutang",
		type: "income",
		description: "Penerimaan pinjaman dari orang lain",
		group: "Penerimaan Dana",
		icon: "🤝",
		color: "#6ee7b7",
	},

	// Group: Penghasilan Pasif
	{
		name: "Bonus",
		type: "income",
		description: "Bonus dari pekerjaan atau pencapaian",
		group: "Penghasilan Pasif",
		icon: "🎯",
		color: "#a7f3d0",
	},
	{
		name: "Dividen",
		type: "income",
		description: "Pembagian keuntungan dari investasi saham",
		group: "Penghasilan Pasif",
		icon: "📊",
		color: "#a7f3d0",
	},
	{
		name: "Bunga Bank",
		type: "income",
		description: "Bunga dari tabungan atau deposito",
		group: "Penghasilan Pasif",
		icon: "🏦",
		color: "#a7f3d0",
	},
	{
		name: "Cashback",
		type: "income",
		description: "Cashback dari transaksi atau promo",
		group: "Penghasilan Pasif",
		icon: "💰",
		color: "#a7f3d0",
	},

	// ========== EXPENSE CATEGORIES ==========
	// Group: Kebutuhan Harian
	{
		name: "Makanan dan Minuman",
		type: "expense",
		description: "Makanan jadi, jajanan, dan minuman",
		group: "Kebutuhan Harian",
		icon: "🍔",
		color: "#ef4444",
	},
	{
		name: "Bahan Mentah dan Kebutuhan Dapur",
		type: "expense",
		description: "Bahan mentah untuk memasak, bumbu, dan keperluan dapur",
		group: "Kebutuhan Harian",
		icon: "🥬",
		color: "#ef4444",
	},
	{
		name: "Kebutuhan Rumah",
		type: "expense",
		description: "Galon, LPG, pembersih rumah, dan perlengkapan RT",
		group: "Kebutuhan Harian",
		icon: "🏠",
		color: "#ef4444",
	},

	// Group: Kebutuhan Pribadi
	{
		name: "Pakaian",
		type: "expense",
		description: "Pakaian, sepatu, dan aksesoris",
		group: "Kebutuhan Pribadi",
		icon: "👕",
		color: "#f87171",
	},
	{
		name: "Skincare, Makeup, dan Perawatan Diri",
		type: "expense",
		description: "Produk kecantikan dan perawatan tubuh",
		group: "Kebutuhan Pribadi",
		icon: "💄",
		color: "#f87171",
	},
	{
		name: "Obat",
		type: "expense",
		description: "Obat-obatan dan vitamin",
		group: "Kebutuhan Pribadi",
		icon: "💊",
		color: "#f87171",
	},

	// Group: Kebutuhan Khusus
	{
		name: "Kebutuhan Anak",
		type: "expense",
		description: "Keperluan khusus anak (mainan, popok, dll)",
		group: "Kebutuhan Khusus",
		icon: "👶",
		color: "#fb923c",
	},
	{
		name: "Kebutuhan Hewan",
		type: "expense",
		description: "Makanan dan perawatan hewan peliharaan",
		group: "Kebutuhan Khusus",
		icon: "🐾",
		color: "#fb923c",
	},

	// Group: Rumah dan Utilitas
	{
		name: "Kontrakan",
		type: "expense",
		description: "Biaya sewa rumah atau kos",
		group: "Rumah dan Utilitas",
		icon: "🏘️",
		color: "#f59e0b",
	},
	{
		name: "Listrik",
		type: "expense",
		description: "Tagihan listrik bulanan",
		group: "Rumah dan Utilitas",
		icon: "⚡",
		color: "#f59e0b",
	},
	{
		name: "Air/PDAM",
		type: "expense",
		description: "Tagihan air PDAM",
		group: "Rumah dan Utilitas",
		icon: "💧",
		color: "#f59e0b",
	},
	{
		name: "WiFi",
		type: "expense",
		description: "Tagihan internet rumah",
		group: "Rumah dan Utilitas",
		icon: "📶",
		color: "#f59e0b",
	},
	{
		name: "Sampah",
		type: "expense",
		description: "Iuran sampah",
		group: "Rumah dan Utilitas",
		icon: "🗑️",
		color: "#f59e0b",
	},
	{
		name: "Perbaikan Rumah",
		type: "expense",
		description: "Renovasi dan perbaikan rumah",
		group: "Rumah dan Utilitas",
		icon: "🔧",
		color: "#f59e0b",
	},

	// Group: Transportasi
	{
		name: "Tiket Transportasi",
		type: "expense",
		description: "Tiket bus, kereta, pesawat, dll",
		group: "Transportasi",
		icon: "🚌",
		color: "#fbbf24",
	},
	{
		name: "Ojek Online",
		type: "expense",
		description: "Ojek online dan taksi online",
		group: "Transportasi",
		icon: "🏍️",
		color: "#fbbf24",
	},
	{
		name: "Bensin",
		type: "expense",
		description: "Bahan bakar kendaraan",
		group: "Transportasi",
		icon: "⛽",
		color: "#fbbf24",
	},
	{
		name: "Parkir",
		type: "expense",
		description: "Biaya parkir kendaraan",
		group: "Transportasi",
		icon: "🅿️",
		color: "#fbbf24",
	},
	{
		name: "Rental",
		type: "expense",
		description: "Sewa kendaraan",
		group: "Transportasi",
		icon: "🚗",
		color: "#fbbf24",
	},
	{
		name: "Perbaikan dan Perawatan Kendaraan",
		type: "expense",
		description: "Service, perbaikan, cuci kendaraan, dan perawatan",
		group: "Transportasi",
		icon: "🔩",
		color: "#fbbf24",
	},

	// Group: Kesehatan dan Kebugaran
	{
		name: "Biaya Kesehatan",
		type: "expense",
		description: "Biaya dokter, RS, dan perawatan kesehatan (non obat)",
		group: "Kesehatan dan Kebugaran",
		icon: "🏥",
		color: "#84cc16",
	},
	{
		name: "Olahraga",
		type: "expense",
		description: "Gym, fitness, peralatan olahraga",
		group: "Kesehatan dan Kebugaran",
		icon: "💪",
		color: "#84cc16",
	},

	// Group: Pendidikan dan Pengembangan
	{
		name: "Biaya Pendidikan",
		type: "expense",
		description: "SPP, kursus, buku, dan keperluan sekolah",
		group: "Pendidikan dan Pengembangan",
		icon: "📚",
		color: "#22c55e",
	},
	{
		name: "Print dan ATK",
		type: "expense",
		description: "Fotokopi, print, dan alat tulis kantor",
		group: "Pendidikan dan Pengembangan",
		icon: "📝",
		color: "#22c55e",
	},

	// Group: Hiburan dan Gaya Hidup
	{
		name: "Hiburan/Rekreasi",
		type: "expense",
		description: "Nonton film, konser, wisata, liburan",
		group: "Hiburan dan Gaya Hidup",
		icon: "🎬",
		color: "#06b6d4",
	},
	{
		name: "Hotel",
		type: "expense",
		description: "Penginapan dan akomodasi",
		group: "Hiburan dan Gaya Hidup",
		icon: "🏨",
		color: "#06b6d4",
	},
	{
		name: "Acara",
		type: "expense",
		description: "Biaya menghadiri atau mengadakan acara",
		group: "Hiburan dan Gaya Hidup",
		icon: "🎉",
		color: "#06b6d4",
	},
	{
		name: "Hadiah",
		type: "expense",
		description: "Hadiah untuk orang lain",
		group: "Hiburan dan Gaya Hidup",
		icon: "🎁",
		color: "#06b6d4",
	},

	// Group: Elektronik dan Teknologi
	{
		name: "Elektronik",
		type: "expense",
		description: "Gadget dan perangkat elektronik",
		group: "Elektronik dan Teknologi",
		icon: "📱",
		color: "#3b82f6",
	},
	{
		name: "Kuota, Pulsa, dan Pascabayar",
		type: "expense",
		description: "Pulsa, paket data, dan tagihan HP",
		group: "Elektronik dan Teknologi",
		icon: "📞",
		color: "#3b82f6",
	},
	{
		name: "Subscription",
		type: "expense",
		description: "Langganan streaming, cloud storage, dll",
		group: "Elektronik dan Teknologi",
		icon: "📺",
		color: "#3b82f6",
	},
	{
		name: "Game dan Aplikasi",
		type: "expense",
		description: "Pembelian game, in-app purchase, software",
		group: "Elektronik dan Teknologi",
		icon: "🎮",
		color: "#3b82f6",
	},
	{
		name: "Layanan Langganan",
		type: "expense",
		description: "Layanan berlangganan lainnya",
		group: "Elektronik dan Teknologi",
		icon: "📦",
		color: "#3b82f6",
	},

	// Group: Layanan Profesional
	{
		name: "Laundry",
		type: "expense",
		description: "Cuci pakaian dan dry cleaning",
		group: "Layanan Profesional",
		icon: "👔",
		color: "#8b5cf6",
	},

	// Group: Sosial dan Keagamaan
	{
		name: "Sedekah",
		type: "expense",
		description: "Sedekah dan infaq",
		group: "Sosial dan Keagamaan",
		icon: "🤲",
		color: "#a855f7",
	},
	{
		name: "Zakat",
		type: "expense",
		description: "Zakat fitrah, zakat mal, dan zakat lainnya",
		group: "Sosial dan Keagamaan",
		icon: "🕌",
		color: "#a855f7",
	},

	// Group: Keuangan dan Investasi
	{
		name: "Tabungan",
		type: "expense",
		description: "Dana yang disisihkan untuk tabungan",
		group: "Keuangan dan Investasi",
		icon: "💰",
		color: "#ec4899",
	},
	{
		name: "Investasi",
		type: "expense",
		description: "Investasi saham, reksadana, crypto, dll",
		group: "Keuangan dan Investasi",
		icon: "📈",
		color: "#ec4899",
	},
	{
		name: "Emas dan Perhiasan",
		type: "expense",
		description: "Pembelian emas atau perhiasan",
		group: "Keuangan dan Investasi",
		icon: "💎",
		color: "#ec4899",
	},
	{
		name: "Cicilan",
		type: "expense",
		description: "Cicilan kendaraan, elektronik, pinjaman, dan lainnya",
		group: "Keuangan dan Investasi",
		icon: "💳",
		color: "#ec4899",
	},

	// Group: Administrasi dan Legal
	{
		name: "Biaya Administrasi dan Denda",
		type: "expense",
		description: "Biaya admin bank, transfer, denda keterlambatan, dll",
		group: "Administrasi dan Legal",
		icon: "📄",
		color: "#f43f5e",
	},
	{
		name: "Asuransi",
		type: "expense",
		description: "Premi asuransi (kesehatan, jiwa, kendaraan)",
		group: "Administrasi dan Legal",
		icon: "🛡️",
		color: "#f43f5e",
	},
	{
		name: "Pajak",
		type: "expense",
		description: "Pajak kendaraan, PBB, dan pajak lainnya",
		group: "Administrasi dan Legal",
		icon: "🏛️",
		color: "#f43f5e",
	},

	// Group: Lain-lain
	{
		name: "Lainnya",
		type: "expense",
		description: "Pengeluaran yang tidak masuk kategori lain",
		group: "Lain-lain",
		icon: "📋",
		color: "#64748b",
	},
];

/**
 * Seed default money categories for all users
 * This should be run after user seeder
 */
const moneyCategoriesSeeder = async () => {
	// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
	console.log("Seeding money categories...");

	try {
		// First, clean up any duplicate categories
		console.log("Checking for duplicate categories...");

		// Step 1: Find duplicates and identify which to keep (oldest one)
		// Step 2: Merge transactions from duplicates to the keeper
		// Step 3: Delete duplicates that have no transactions
		const duplicateCleanup = await db.execute(sql`
			WITH duplicates AS (
				-- Find all duplicate categories and rank them
				SELECT 
					id,
					user_id,
					name,
					type,
					created_at,
					ROW_NUMBER() OVER (
						PARTITION BY user_id, name, type 
						ORDER BY created_at ASC
					) as row_num
				FROM money_categories
			),
			keeper_categories AS (
				-- These are the categories we'll keep (oldest of each duplicate set)
				SELECT id, user_id, name, type
				FROM duplicates
				WHERE row_num = 1
			),
			duplicate_categories AS (
				-- These are the duplicates we want to remove
				SELECT id, user_id, name, type
				FROM duplicates
				WHERE row_num > 1
			),
			merge_transactions AS (
				-- Move all transactions from duplicates to the keeper
				UPDATE money_transactions t
				SET category_id = k.id
				FROM duplicate_categories d
				JOIN keeper_categories k 
					ON d.user_id = k.user_id 
					AND d.name = k.name 
					AND d.type = k.type
				WHERE t.category_id = d.id
				RETURNING d.id as moved_from_category
			)
			-- Delete duplicate categories (they should have no transactions now)
			DELETE FROM money_categories
			WHERE id IN (
				SELECT id 
				FROM duplicate_categories
			)
		`);

		const deletedCount = duplicateCleanup.length || 0;
		if (deletedCount > 0) {
			console.log(
				`Merged and deleted ${deletedCount} duplicate categories`,
			);
		}

		// Get all users
		const users = await db.query.users.findMany({
			columns: { id: true },
		});

		if (users.length === 0) {
			console.log("No users found. Skipping category seeding.");
			return;
		}

		let totalInserted = 0;
		let totalSkipped = 0;

		// Process each user separately to check for existing categories
		for (const user of users) {
			// Get existing categories for this user
			const existingCategories = await db.query.moneyCategories.findMany({
				where: (categories, { eq }) => eq(categories.userId, user.id),
				columns: { name: true, type: true },
			});

			// Create a Set of existing category keys (name + type)
			const existingKeys = new Set(
				existingCategories.map((cat) => `${cat.name}|${cat.type}`),
			);

			// Filter out categories that already exist
			const categoriesToInsert = categoriesSeedData
				.filter((category) => {
					const key = `${category.name}|${category.type}`;
					return !existingKeys.has(key);
				})
				.map((category) => ({
					userId: user.id,
					name: category.name,
					type: category.type,
					icon: category.icon,
					color: category.color,
					isActive: true,
				}));

			if (categoriesToInsert.length > 0) {
				await db.insert(moneyCategories).values(categoriesToInsert);
				totalInserted += categoriesToInsert.length;
			}

			totalSkipped +=
				categoriesSeedData.length - categoriesToInsert.length;
		}

		console.log(
			`Seeded ${totalInserted} new categories, skipped ${totalSkipped} existing categories for ${users.length} user(s)`,
		);
	} catch (error) {
		console.error("Error seeding money categories:", error);
		throw error;
	}
};

export default moneyCategoriesSeeder;
