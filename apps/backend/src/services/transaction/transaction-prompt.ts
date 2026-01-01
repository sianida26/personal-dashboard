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

RULES:
1. Default currency is IDR unless specified
2. Amounts should be numeric (no currency symbols)
3. Choose the most appropriate category from the lists above
4. Each transaction must have: name, amount, currency, type, category

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

Input: "Gaji bulan ini 5jt, bonus 1.5jt"
Output: [{"name":"Gaji","amount":5000000,"currency":"IDR","type":"income","category":"Gaji"},{"name":"Bonus","amount":1500000,"currency":"IDR","type":"income","category":"Bonus"}]

Input: "Hari ini cerah"
Output: []

Now extract from this input:
${input}`;
}
