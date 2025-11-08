ALTER TABLE "notification_channel_overrides" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."notification_preference_category";--> statement-breakpoint
CREATE TYPE "public"."notification_preference_category" AS ENUM('global', 'general', 'system');--> statement-breakpoint
ALTER TABLE "notification_channel_overrides" ALTER COLUMN "category" SET DATA TYPE "public"."notification_preference_category" USING "category"::"public"."notification_preference_category";--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ALTER COLUMN "category" SET DATA TYPE "public"."notification_preference_category" USING "category"::"public"."notification_preference_category";