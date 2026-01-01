CREATE TYPE "public"."account_type" AS ENUM('cash', 'bank', 'e_wallet', 'credit_card', 'investment');--> statement-breakpoint
CREATE TYPE "public"."budget_period" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."saving_log_type" AS ENUM('add', 'withdraw');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('manual', 'import');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TABLE "money_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "account_type" NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "money_budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text,
	"amount" numeric(15, 2) NOT NULL,
	"period" "budget_period" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "money_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "category_type" NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"parent_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "money_saving_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"saving_id" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" "saving_log_type" NOT NULL,
	"note" text,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "money_savings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"target_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"target_date" date,
	"icon" varchar(50),
	"color" varchar(7),
	"is_achieved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "money_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"category_id" text,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"to_account_id" text,
	"source" "transaction_source" DEFAULT 'manual' NOT NULL,
	"tags" jsonb,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "money_accounts" ADD CONSTRAINT "money_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_budgets" ADD CONSTRAINT "money_budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_budgets" ADD CONSTRAINT "money_budgets_category_id_money_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."money_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_categories" ADD CONSTRAINT "money_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_categories" ADD CONSTRAINT "money_categories_parent_id_money_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."money_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_saving_logs" ADD CONSTRAINT "money_saving_logs_saving_id_money_savings_id_fk" FOREIGN KEY ("saving_id") REFERENCES "public"."money_savings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_savings" ADD CONSTRAINT "money_savings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_transactions" ADD CONSTRAINT "money_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_transactions" ADD CONSTRAINT "money_transactions_account_id_money_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."money_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_transactions" ADD CONSTRAINT "money_transactions_category_id_money_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."money_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_transactions" ADD CONSTRAINT "money_transactions_to_account_id_money_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."money_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_money_accounts_user_id" ON "money_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_money_accounts_is_active" ON "money_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_money_budgets_user_id" ON "money_budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_money_budgets_category_id" ON "money_budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_money_budgets_period" ON "money_budgets" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_money_budgets_is_active" ON "money_budgets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_money_categories_user_id" ON "money_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_money_categories_type" ON "money_categories" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_money_categories_parent_id" ON "money_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_money_categories_is_active" ON "money_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_money_saving_logs_saving_id" ON "money_saving_logs" USING btree ("saving_id");--> statement-breakpoint
CREATE INDEX "idx_money_saving_logs_date" ON "money_saving_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_money_savings_user_id" ON "money_savings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_money_savings_is_achieved" ON "money_savings" USING btree ("is_achieved");--> statement-breakpoint
CREATE INDEX "idx_money_transactions_user_id" ON "money_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_money_transactions_account_id" ON "money_transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_money_transactions_category_id" ON "money_transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_money_transactions_type" ON "money_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_money_transactions_date" ON "money_transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_money_transactions_to_account_id" ON "money_transactions" USING btree ("to_account_id");