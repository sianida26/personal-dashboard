# Money Tracker Module - Overview

## Module Description
Personal finance management system for tracking income, expenses, accounts, savings, and providing analytics/budgeting features.

## Subprojects
1. **Expense/Income Tracker & Categories** - Core transaction management
2. **Accounts Integration & Savings** - Multi-account and savings goals
3. **Analytics & Budgeting** - Financial insights and budget planning

## Tech Stack
- Backend: Elysia.js + Drizzle ORM + PostgreSQL
- Frontend: React + TanStack Router + ServerDataTable

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────┐     ┌─────────────────────┐
│   money_accounts    │     │  money_categories   │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ user_id (FK)        │     │ user_id (FK)        │
│ name                │     │ name                │
│ type (enum)         │     │ type (enum)         │
│ balance             │     │ icon                │
│ currency            │     │ color               │
│ icon                │     │ parent_id (FK,self) │
│ color               │     │ is_active           │
│ is_active           │     │ created_at          │
│ created_at          │     │ updated_at          │
│ updated_at          │     └─────────────────────┘
└─────────────────────┘              │
         │                           │
         │ 1:N                       │ 1:N
         ▼                           ▼
┌─────────────────────────────────────────────────┐
│               money_transactions                │
├─────────────────────────────────────────────────┤
│ id (PK)                                         │
│ user_id (FK)                                    │
│ account_id (FK) → money_accounts                │
│ category_id (FK) → money_categories             │
│ type (enum: income/expense/transfer)            │
│ amount                                          │
│ description                                     │
│ date                                            │
│ to_account_id (FK, nullable) → money_accounts   │
│ source (enum: manual/waha/import)               │
│ tags                                            │
│ attachment_url                                  │
│ created_at                                      │
│ updated_at                                      │
└─────────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│   money_savings     │     │   money_budgets     │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ user_id (FK)        │     │ user_id (FK)        │
│ name                │     │ category_id (FK)    │
│ target_amount       │     │ amount              │
│ current_amount      │     │ period (enum)       │
│ target_date         │     │ start_date          │
│ icon                │     │ end_date            │
│ color               │     │ is_active           │
│ is_achieved         │     │ created_at          │
│ created_at          │     │ updated_at          │
│ updated_at          │     └─────────────────────┘
└─────────────────────┘

┌─────────────────────┐
│ money_saving_logs   │
├─────────────────────┤
│ id (PK)             │
│ saving_id (FK)      │
│ amount              │
│ type (add/withdraw) │
│ note                │
│ date                │
│ created_at          │
└─────────────────────┘
```

## Enums

```typescript
// Account Types
enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  E_WALLET = 'e_wallet',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment'
}

// Category Types
enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

// Transaction Types
enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

// Transaction Source
enum TransactionSource {
  MANUAL = 'manual',
  IMPORT = 'import'
}

// Budget Period
enum BudgetPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}
```
