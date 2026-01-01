# Subproject 2: Accounts Integration & Savings

## Overview
Multi-account management system with balance tracking and savings goals functionality.

---

## Use Case Diagram

```
                    ┌─────────────────────────────────────┐
                    │       Accounts & Savings System     │
                    └─────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
    ┌───────────────────┐                         ┌───────────────────┐
    │      Accounts     │                         │      Savings      │
    └───────────────────┘                         └───────────────────┘
              │                                               │
         ┌────┴────┐                                     ┌────┴────┐
         │  User   │                                     │  User   │
         └────┬────┘                                     └────┬────┘
              │                                               │
    ┌─────────┴─────────┐                         ┌──────────┴──────────┐
    │ • Create Account  │                         │ • Create Goal       │
    │ • Edit Account    │                         │ • Add to Savings    │
    │ • Delete Account  │                         │ • Withdraw Savings  │
    │ • View Balance    │                         │ • Track Progress    │
    │ • Transfer Between│                         │ • Mark Achieved     │
    │ • Balance History │                         │ • View History      │
    │ • Reconcile       │                         └─────────────────────┘
    └───────────────────┘
```

---

## Flow Diagrams

### Account Balance Update Flow
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Transaction │───▶│ Determine    │───▶│ Update Account  │
│   Created   │    │ Account(s)   │    │    Balance      │
└─────────────┘    └──────────────┘    └────────┬────────┘
                                                │
                   ┌────────────────────────────┤
                   │                            │
                   ▼                            ▼
           ┌─────────────┐              ┌─────────────┐
           │   Income    │              │   Expense   │
           │ +amount to  │              │ -amount from│
           │   account   │              │   account   │
           └─────────────┘              └─────────────┘
                   │
                   │ (if transfer)
                   ▼
           ┌─────────────────────┐
           │ -from source acct   │
           │ +to dest acct       │
           └─────────────────────┘
```

### Savings Goal Flow
```
┌─────────┐    ┌───────────────┐    ┌─────────────┐    ┌────────────┐
│  Start  │───▶│ Create Savings│───▶│ Set Target  │───▶│ Set Target │
└─────────┘    │     Goal      │    │   Amount    │    │    Date    │
               └───────────────┘    └─────────────┘    └─────┬──────┘
                                                             │
       ┌─────────────────────────────────────────────────────┘
       ▼
┌─────────────┐    ┌─────────────┐    ┌───────────────┐
│ Add Funds   │◀──▶│  Track      │───▶│ Goal Achieved │
│ Periodically│    │  Progress   │    │ Notification  │
└─────────────┘    └─────────────┘    └───────────────┘
       │
       ▼
┌─────────────────┐
│ Create Saving   │
│ Log Entry       │
└─────────────────┘
```

### Account Reconciliation Flow
```
┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
│ Select      │───▶│ Enter Actual  │───▶│ Compare with    │
│ Account     │    │   Balance     │    │ System Balance  │
└─────────────┘    └───────────────┘    └────────┬────────┘
                                                 │
                          ┌──────────────────────┴───────────────────┐
                          ▼                                          ▼
                   ┌─────────────┐                            ┌─────────────┐
                   │   Match     │                            │  Mismatch   │
                   └──────┬──────┘                            └──────┬──────┘
                          │                                          │
                          ▼                                          ▼
                   ┌─────────────┐                     ┌──────────────────────┐
                   │  Mark as    │                     │ Create Adjustment    │
                   │ Reconciled  │                     │ Transaction          │
                   └─────────────┘                     └──────────────────────┘
```

---

## API Endpoints

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/accounts` | List all accounts |
| POST | `/api/money/accounts` | Create account |
| GET | `/api/money/accounts/:id` | Get account detail |
| PUT | `/api/money/accounts/:id` | Update account |
| DELETE | `/api/money/accounts/:id` | Delete (soft) account |
| GET | `/api/money/accounts/:id/history` | Balance history |
| POST | `/api/money/accounts/:id/reconcile` | Reconcile balance |
| GET | `/api/money/accounts/summary` | All accounts summary |

### Savings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/savings` | List savings goals |
| POST | `/api/money/savings` | Create savings goal |
| GET | `/api/money/savings/:id` | Get savings detail |
| PUT | `/api/money/savings/:id` | Update savings goal |
| DELETE | `/api/money/savings/:id` | Delete savings goal |
| POST | `/api/money/savings/:id/deposit` | Add to savings |
| POST | `/api/money/savings/:id/withdraw` | Withdraw from savings |
| GET | `/api/money/savings/:id/logs` | Savings transaction logs |

---

## Pages

### 1. Accounts Overview (`/money/accounts`)
- **Components**: AccountCard, AccountSummary, QuickTransferModal
- **Features**:
  - Grid of account cards with balance
  - Total net worth calculation
  - Account type grouping (Cash, Bank, E-Wallet, etc.)
  - Quick transfer between accounts
  - Balance trend mini-chart per account

### 2. Account Detail (`/money/accounts/:id`)
- **Components**: BalanceChart, TransactionList, ReconcileModal
- **Features**:
  - Balance history chart
  - Recent transactions (filtered to this account)
  - Reconciliation action
  - Edit account details
  - Monthly in/out summary

### 3. Create/Edit Account (`/money/accounts/new`, `/money/accounts/:id/edit`)
- **Components**: AccountForm
- **Features**:
  - Account type selector
  - Name & initial balance
  - Icon & color picker
  - Currency selector

### 4. Savings Goals (`/money/savings`)
- **Components**: SavingsCard, ProgressBar, SavingsForm modal
- **Features**:
  - Grid of savings goals with progress
  - Progress percentage & remaining amount
  - Days remaining countdown
  - Quick deposit/withdraw actions
  - Achievement celebration modal

### 5. Savings Detail (`/money/savings/:id`)
- **Components**: ProgressChart, SavingsLogList
- **Features**:
  - Large progress visualization
  - Deposit/Withdraw history (ServerDataTable)
  - Projected completion date
  - Edit goal details

---

## Database Schema (Subproject 2)

```sql
-- Accounts table
CREATE TABLE money_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'cash' | 'bank' | 'e_wallet' | 'credit_card' | 'investment'
  balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'IDR',
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Balance history (for reconciliation & tracking)
CREATE TABLE money_account_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES money_accounts(id),
  balance DECIMAL(15,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW(),
  note TEXT
);

-- Savings goals
CREATE TABLE money_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Savings transaction logs
CREATE TABLE money_saving_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saving_id UUID NOT NULL REFERENCES money_savings(id),
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'deposit' | 'withdraw'
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Validation Rules

```typescript
// Account validation
const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['cash', 'bank', 'e_wallet', 'credit_card', 'investment']),
  balance: z.number().default(0),
  currency: z.string().length(3).default('IDR'),
  icon: z.string().optional(),
  color: z.string().optional()
});

// Savings validation
const savingsSchema = z.object({
  name: z.string().min(1).max(100),
  target_amount: z.number().positive(),
  target_date: z.date().optional(),
  icon: z.string().optional(),
  color: z.string().optional()
});

// Savings deposit/withdraw
const savingsLogSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['deposit', 'withdraw']),
  note: z.string().max(500).optional()
});
```

---

## Business Rules

1. **Balance Updates**: Account balance auto-updates on every transaction
2. **Transfer**: Creates 2 entries (debit from source, credit to destination)
3. **Reconciliation**: Creates adjustment transaction if needed
4. **Savings Withdraw**: Cannot exceed current_amount
5. **Achievement**: Auto-mark achieved when current >= target
6. **Soft Delete**: Accounts with transactions are soft-deleted (is_active = false)
