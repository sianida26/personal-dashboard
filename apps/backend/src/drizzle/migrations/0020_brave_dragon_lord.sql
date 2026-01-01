ALTER TABLE "money_categories" DROP CONSTRAINT "money_categories_parent_id_money_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "money_transactions" ADD COLUMN "wa_message_id" text;