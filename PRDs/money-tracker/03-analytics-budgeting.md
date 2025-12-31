# Subproject 3: Analytics & Budgeting

## Overview
Financial analytics dashboard and budget management system with insights and spending alerts.

---

## Use Case Diagram

```
                    ┌─────────────────────────────────────┐
                    │     Analytics & Budgeting System    │
                    └─────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   Analytics   │           │   Budgeting   │           │    Reports    │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
   ┌────┴────┐                   ┌────┴────┐                   ┌────┴────┐
   │  User   │                   │  User   │                   │  User   │
   └────┬────┘                   └────┬────┘                   └────┬────┘
        │                             │                             │
   ┌────┴────────────┐           ┌────┴────────────┐           ┌────┴────────────┐
   │ • View Dashboard│           │ • Create Budget │           │ • Monthly Report│
   │ • Income vs Exp │           │ • Edit Budget   │           │ • Yearly Report │
   │ • Category Dist │           │ • Delete Budget │           │ • Custom Range  │
   │ • Trend Analysis│           │ • Track Progress│           │ • Export PDF    │
   │ • Compare Period│           │ • View Alerts   │           │ • Email Report  │
   │ • Cash Flow     │           │ • Rollover      │           └─────────────────┘
   └─────────────────┘           └─────────────────┘
```

---

## Flow Diagrams

### Analytics Dashboard Flow
```
┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
│ User Opens  │───▶│ Load Period   │───▶│ Aggregate       │
│  Dashboard  │    │ (Default:     │    │ Transactions    │
└─────────────┘    │  This Month)  │    └────────┬────────┘
                   └───────────────┘             │
                                                 ▼
                                    ┌────────────────────────┐
                                    │   Calculate Metrics    │
                                    │ • Total Income         │
                                    │ • Total Expense        │
                                    │ • Net Flow             │
                                    │ • Category Breakdown   │
                                    │ • Top Spending         │
                                    └───────────┬────────────┘
                                                │
                   ┌────────────────────────────┼────────────────────────────┐
                   ▼                            ▼                            ▼
           ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
           │ Summary     │              │   Charts    │              │ Insights    │
           │   Cards     │              │ (Pie,Bar,   │              │ & Tips      │
           └─────────────┘              │  Line)      │              └─────────────┘
                                        └─────────────┘
```

### Budget Tracking Flow
```
┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
│ Create      │───▶│ Set Category  │───▶│ Set Amount &    │
│ Budget      │    │ & Period      │    │    Period       │
└─────────────┘    └───────────────┘    └────────┬────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Budget Active                            │
└─────────────────────────────────────────────────────────────┘
        │                     │                      │
        ▼                     ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Transaction   │    │ Daily Check   │    │ Period End    │
│   Added       │    │ (Job/Cron)    │    │   Reached     │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Update Spent  │    │ Check         │    │ Generate      │
│   Amount      │    │ Thresholds    │    │   Summary     │
└───────┬───────┘    └───────┬───────┘    └───────────────┘
        │                    │
        └────────┬───────────┘
                 ▼
        ┌───────────────────┐
        │ > 80% → Warning   │
        │ > 100% → Alert    │
        │ Send Notification │
        └───────────────────┘
```

### Report Generation Flow
```
┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
│ Select      │───▶│ Choose Format │───▶│ Generate        │
│ Date Range  │    │ (PDF/Excel)   │    │    Report       │
└─────────────┘    └───────────────┘    └────────┬────────┘
                                                 │
                   ┌─────────────────────────────┤
                   │                             │
                   ▼                             ▼
           ┌─────────────┐              ┌─────────────┐
           │  Download   │              │ Send Email  │
           │    File     │              │   (opt)     │
           └─────────────┘              └─────────────┘
```

---

## API Endpoints

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/analytics/summary` | Period summary (income/expense/net) |
| GET | `/api/money/analytics/category-breakdown` | Expense by category |
| GET | `/api/money/analytics/trend` | Income/expense trend over time |
| GET | `/api/money/analytics/cash-flow` | Daily cash flow |
| GET | `/api/money/analytics/top-spending` | Top spending categories |
| GET | `/api/money/analytics/compare` | Compare two periods |
| GET | `/api/money/analytics/insights` | AI-generated insights |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/budgets` | List all budgets |
| POST | `/api/money/budgets` | Create budget |
| GET | `/api/money/budgets/:id` | Get budget detail |
| PUT | `/api/money/budgets/:id` | Update budget |
| DELETE | `/api/money/budgets/:id` | Delete budget |
| GET | `/api/money/budgets/overview` | All budgets with progress |
| GET | `/api/money/budgets/:id/history` | Budget history by period |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/money/reports/monthly` | Monthly report data |
| GET | `/api/money/reports/yearly` | Yearly report data |
| GET | `/api/money/reports/custom` | Custom date range report |
| POST | `/api/money/reports/export` | Export report (PDF/Excel) |
| POST | `/api/money/reports/email` | Email report |

---

## Pages

### 1. Analytics Dashboard (`/money/analytics`)
- **Components**: SummaryCards, PieChart, BarChart, LineChart, InsightCard
- **Features**:
  - Period selector (This Month, Last Month, Custom)
  - Summary cards: Total Income, Total Expense, Net Flow, Savings Rate
  - Expense breakdown pie chart by category
  - Income vs Expense bar chart (by week/month)
  - Cash flow line chart
  - Top 5 spending categories
  - AI-generated insights/tips

### 2. Trend Analysis (`/money/analytics/trends`)
- **Components**: TrendChart, ComparisonTable
- **Features**:
  - Multi-period comparison chart
  - YoY / MoM comparison
  - Category trend breakdown
  - Anomaly detection highlights

### 3. Budget List (`/money/budgets`)
- **Components**: BudgetCard, ProgressBar, BudgetForm modal
- **Features**:
  - Grid of budget cards with progress
  - Progress bar with color coding (green/yellow/red)
  - Days remaining in period
  - Quick add budget button
  - Filter by period (active/all)

### 4. Budget Detail (`/money/budgets/:id`)
- **Components**: BudgetProgress, SpendingBreakdown, HistoryChart
- **Features**:
  - Large progress visualization
  - Daily spending in this budget
  - Transaction list (filtered to category)
  - Historical performance chart
  - Remaining per day calculation

### 5. Reports (`/money/reports`)
- **Components**: ReportConfig, ReportPreview, ExportButton
- **Features**:
  - Report type selector (Monthly/Yearly/Custom)
  - Date range picker
  - Preview before export
  - Export to PDF/Excel
  - Schedule recurring email reports

---

## Database Schema (Subproject 3)

```sql
-- Budgets table
CREATE TABLE money_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES money_categories(id), -- null = overall budget
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date DATE NOT NULL,
  end_date DATE, -- null = recurring
  rollover BOOLEAN DEFAULT false, -- carry unused to next period
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget period history (for tracking)
CREATE TABLE money_budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES money_budgets(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  budgeted_amount DECIMAL(15,2) NOT NULL,
  spent_amount DECIMAL(15,2) DEFAULT 0,
  rollover_amount DECIMAL(15,2) DEFAULT 0, -- from previous period
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification alerts
CREATE TABLE money_budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES money_budgets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  threshold INTEGER NOT NULL, -- percentage (e.g., 80, 100)
  triggered_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- Scheduled reports
CREATE TABLE money_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  report_type VARCHAR(20) NOT NULL, -- 'monthly' | 'yearly'
  email VARCHAR(255) NOT NULL,
  schedule VARCHAR(50) NOT NULL, -- cron expression or 'first_of_month'
  last_sent_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Validation Rules

```typescript
// Budget validation
const budgetSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.date(),
  end_date: z.date().optional(),
  rollover: z.boolean().default(false)
});

// Report export validation
const reportExportSchema = z.object({
  type: z.enum(['monthly', 'yearly', 'custom']),
  start_date: z.date(),
  end_date: z.date(),
  format: z.enum(['pdf', 'excel']),
  email: z.string().email().optional()
});

// Analytics query validation
const analyticsQuerySchema = z.object({
  start_date: z.date(),
  end_date: z.date(),
  group_by: z.enum(['day', 'week', 'month']).optional()
});
```

---

## Analytics Calculations

```typescript
// Summary Metrics
interface PeriodSummary {
  totalIncome: number;
  totalExpense: number;
  netFlow: number; // income - expense
  savingsRate: number; // (income - expense) / income * 100
  transactionCount: number;
  averageExpense: number;
}

// Category Breakdown
interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

// Budget Progress
interface BudgetProgress {
  budgetId: string;
  name: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  daysRemaining: number;
  dailyRemaining: number; // remainingAmount / daysRemaining
  status: 'on_track' | 'warning' | 'over_budget';
}
```

---

## Background Jobs

1. **Daily Budget Check** - Check all active budgets for threshold alerts
2. **Period End Summary** - Generate period summary when budget period ends
3. **Scheduled Reports** - Send scheduled email reports
4. **Insights Generation** - Generate AI insights weekly

---

## Notification Triggers

| Event | Threshold | Notification |
|-------|-----------|--------------|
| Budget 80% used | 80% | Warning: "You've used 80% of your {budget} budget" |
| Budget exceeded | 100% | Alert: "You've exceeded your {budget} budget" |
| Period end | End of period | Summary: "Your {period} spending summary is ready" |
| Unusual spending | > 2x average | Alert: "Unusual spending detected in {category}" |
