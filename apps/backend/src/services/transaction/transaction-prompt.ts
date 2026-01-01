import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";

/**
 * Transaction extraction prompt template
 * Uses categories from the database to guide AI extraction
 */

/**
 * Fetches income and expense categories from the database for a specific user
 * @param userId - The user ID to fetch categories for
 * @returns Object with income and expense category names
 */
async function getCategories(userId: string) {
	const categories = await db.query.moneyCategories.findMany({
		where: eq(moneyCategories.userId, userId),
		columns: {
			name: true,
			type: true,
		},
	});

	const incomeCategories = categories
		.filter((cat) => cat.type === "income")
		.map((cat) => cat.name);

	const expenseCategories = categories
		.filter((cat) => cat.type === "expense")
		.map((cat) => cat.name);

	return { incomeCategories, expenseCategories };
}

/**
 * Builds the transaction extraction prompt with the input message
 * @param input - The message to extract transactions from
 * @param userId - The user ID to fetch categories for
 * @returns Complete prompt for the AI model
 */
export async function buildTransactionPrompt(
	input: string,
	userId: string,
): Promise<string> {
	const { incomeCategories, expenseCategories } = await getCategories(userId);

	return `You are a transaction extractor for Indonesian users. Extract transaction details from the input and return ONLY a JSON array. If the input is not a transaction record, return an empty array [].

CATEGORIES:
- Income: ${incomeCategories.join(", ")}
- Expense: ${expenseCategories.join(", ")}

INDONESIAN CULTURE CONTEXT:
- "buwuh", "kondangan", "sumbangan nikahan" = giving money at weddings → category "Hadiah" (expense, you give money)
- "arisan" = social gathering with money pooling → usually expense when paying, income when winning
- "THR" = Tunjangan Hari Raya (holiday bonus) → income
- "angpao" = monetary gift, usually received → income if received, expense if given
- "zakat", "infaq", "sedekah", "shodaqoh" = religious charity → expense
- "parkir", "tukang parkir" = parking fee → expense "Transportasi"
- "ojol", "gojek", "grab" = ride-hailing → expense "Transportasi"
- "warteg", "warung", "makan di luar" = eating out → expense "Makanan dan Minuman"
- "kopi", "ngopi", "starbucks", "janji jiwa" = coffee → expense "Makanan dan Minuman"
- "pulsa", "kuota", "paket data" = phone credit/data → expense "Utilitas"
- "listrik", "PLN", "token listrik" = electricity → expense "Utilitas"
- "bensin", "pertamax", "pertalite", "solar" = fuel → expense "Transportasi"
- "laundry", "cuci baju" = laundry service → expense "Layanan"
- "potong rambut", "barbershop", "salon" = haircut → expense "Perawatan Diri"

COMMON INDONESIAN SNACKS/FOOD:
- "pringles", "chitato", "lays" = chips → "Makanan dan Minuman"
- "regal", "oreo", "khong guan" = biscuits → "Makanan dan Minuman"
- "milo", "teh kotak", "fruit tea" = drinks → "Makanan dan Minuman"
- "indomie", "mie sedaap", "pop mie" = instant noodles → "Makanan dan Minuman"

IMPORTANT RULES:
1. Default currency is IDR unless specified
2. Amounts should be numeric (no currency symbols)
3. Choose the most appropriate category from the lists above
4. Each transaction must have: name, amount, currency, type, category
5. **DEFAULT TO EXPENSE** if you're unsure whether it's income or expense
6. Only classify as INCOME if you're 90%+ confident (e.g., "gaji", "dapat hadiah", "terima transferan", "bonus", "THR", "menang arisan")
7. Common income indicators: "gaji", "dapat", "terima", "dapet", "dikasih", "menang", "bonus"
8. Common expense indicators: "beli", "bayar", "buwuh", "kasih", "traktir", "transfer ke"
9. **CRITICAL**: When an item name is followed by an amount (e.g., "pringles 30k"), this is ALWAYS a transaction, even without explicit verbs like "beli"
10. Multi-line inputs with "item + amount" pattern should each be treated as separate expense transactions
11. Amount formats: "30k" = 30000, "1.5jt" or "1.5juta" = 1500000, "500rb" or "500ribu" = 500000

OUTPUT FORMAT (array of transactions):
[
  {
    "name": "item/source description",
    "amount": 50000,
    "currency": "IDR",
    "type": "expense",
    "category": "Makanan dan Minuman"
  }
]

EXAMPLES:
Input: "Beli nasi goreng 25rb"
Output: [{"name":"Nasi goreng","amount":25000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"}]

Input: "pringles 30k\nregal 20k\nmilo 10k"
Output: [{"name":"Pringles","amount":30000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"},{"name":"Regal","amount":20000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"},{"name":"Milo","amount":10000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"}]

Input: "indomie 5rb, teh kotak 3rb"
Output: [{"name":"Indomie","amount":5000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"},{"name":"Teh kotak","amount":3000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"}]

Input: "Gaji bulan ini 5jt, bonus 1.5jt"
Output: [{"name":"Gaji","amount":5000000,"currency":"IDR","type":"income","category":"Gaji"},{"name":"Bonus","amount":1500000,"currency":"IDR","type":"income","category":"Bonus"}]

Input: "Buwuh nikahan temen 500rb"
Output: [{"name":"Buwuh nikahan temen","amount":500000,"currency":"IDR","type":"expense","category":"Hadiah"}]

Input: "Kondangan mas andi 300k"
Output: [{"name":"Kondangan mas andi","amount":300000,"currency":"IDR","type":"expense","category":"Hadiah"}]

Input: "Dapat angpao 100rb"
Output: [{"name":"Angpao","amount":100000,"currency":"IDR","type":"income","category":"Hadiah"}]

Input: "THR dari kantor 2jt"
Output: [{"name":"THR dari kantor","amount":2000000,"currency":"IDR","type":"income","category":"Bonus"}]

Input: "Zakat 500rb"
Output: [{"name":"Zakat","amount":500000,"currency":"IDR","type":"expense","category":"Donasi"}]

Input: "Ngopi di starbucks 75rb"
Output: [{"name":"Ngopi di starbucks","amount":75000,"currency":"IDR","type":"expense","category":"Makanan dan Minuman"}]

Input: "Hari ini cerah"
Output: []

Now extract from this input:
${input}`;
}
