# Subproject 1: Expense/Income Tracker & Categories

## Overview
Core transaction management system with category organization.

---

## Use Case Diagram

```
                    ┌─────────────────────────────────────┐
                    │         Money Tracker System        │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌───────────────┐                   ┌───────────────┐
          │  Transactions │                   │  Categories   │
          └───────────────┘                   └───────────────┘
                    │                                   │
               ┌────┴────┐                         ┌────┴────┐
               │  User   │                         │  User   │
               └────┬────┘                         └────┬────┘
                    │                                   │
          ┌─────────┴─────────┐                ┌────────┴────────┐
          │ • Add Income      │                │ • Create Cat    │
          │ • Add Expense     │                │ • Edit Cat      │
          │ • Add Transfer    │                │ • Delete Cat    │
          │ • Edit Trans      │                │ • List Cats     │
          │ • Delete Trans    │                │ • Set Parent    │
          │ • View History    │                └─────────────────┘
          │ • Filter/Search   │
          │ • Export Data     │
          └───────────────────┘
```

---

## Flow Diagrams

### Manual Transaction Flow
```
┌─────────┐    ┌──────────────┐    ┌───────────────┐    ┌─────────────┐
│  Start  │───▶│ Select Type  │───▶│ Fill Details  │───▶│  Validate   │
└─────────┘    │(In/Out/Trans)│    │ Amount,Cat,   │    │   Input     │
               └──────────────┘    │ Account,Date  │    └──────┬──────┘
                                   └───────────────┘           │
                                                         ┌─────┴─────┐
                                                         ▼           ▼
                                                    ┌────────┐  ┌────────┐
                                                    │ Valid  │  │Invalid │
                                                    └───┬────┘  └───┬────┘
                                                        │           │
                                                        ▼           ▼
                                              ┌──────────────┐ ┌──────────┐
                                              │Save & Update │ │Show Error│
                                              │   Balance    │ └──────────┘
                                              └──────────────┘
```

---

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/transactions` | List transactions (paginated, ServerDataTable) |
| POST | `/api/money/transactions` | Create transaction |
| GET | `/api/money/transactions/:id` | Get transaction detail |
| PUT | `/api/money/transactions/:id` | Update transaction |
| DELETE | `/api/money/transactions/:id` | Delete transaction |
| GET | `/api/money/transactions/export` | Export to CSV/Excel |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/categories` | List all categories |
| POST | `/api/money/categories` | Create category |
| PUT | `/api/money/categories/:id` | Update category |
| DELETE | `/api/money/categories/:id` | Delete category |
| GET | `/api/money/categories/tree` | Get categories as tree |

---

## Pages

### 1. Transactions List (`/money/transactions`)
- **Components**: ServerDataTable, FilterPanel, QuickAddButton
- **Features**:
  - Paginated table with sorting
  - Filter by: date range, type, category, account, amount range
  - Quick stats cards (total in/out this month)
  - Bulk actions (delete, export selected)
  - Quick add floating button

### 2. Add/Edit Transaction (`/money/transactions/new`, `/money/transactions/:id/edit`)
- **Components**: TransactionForm, CategoryPicker, AccountSelector
- **Features**:
  - Type selector (income/expense/transfer)
  - Amount input with calculator
  - Category dropdown with recent suggestions
  - Account selector
  - Date picker (default: today)
  - Description & tags input
  - Attachment upload (receipt)

### 3. Categories Management (`/money/categories`)
- **Components**: CategoryTree, CategoryForm modal
- **Features**:
  - Tree view with drag-drop reorder
  - Separate tabs for Income/Expense
  - Icon & color picker
  - Parent category selector
  - Usage stats per category

---

## Database Schema (Subproject 1)

```sql
-- Categories table
CREATE TABLE money_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'income' | 'expense'
  icon VARCHAR(50),
  color VARCHAR(20),
  parent_id UUID REFERENCES money_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE money_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  account_id UUID NOT NULL REFERENCES money_accounts(id),
  category_id UUID REFERENCES money_categories(id),
  type VARCHAR(20) NOT NULL, -- 'income' | 'expense' | 'transfer'
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  to_account_id UUID REFERENCES money_accounts(id), -- for transfers
  source VARCHAR(20) DEFAULT 'manual', -- 'manual' | 'import'
  tags TEXT[], -- array of tags
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Validation Rules

```typescript
// Transaction validation
const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  to_account_id: z.string().uuid().optional(), // required for transfer
  date: z.date(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional()
});

// Category validation
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
  parent_id: z.string().uuid().optional()
});
```
