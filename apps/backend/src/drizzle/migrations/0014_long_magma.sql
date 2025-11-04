ALTER TABLE "notification_channel_overrides" ALTER COLUMN "channel" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ALTER COLUMN "channel" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."notification_channel";--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('inApp', 'email', 'whatsapp');--> statement-breakpoint
ALTER TABLE "notification_channel_overrides" ALTER COLUMN "channel" SET DATA TYPE "public"."notification_channel" USING "channel"::"public"."notification_channel";--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ALTER COLUMN "channel" SET DATA TYPE "public"."notification_channel" USING "channel"::"public"."notification_channel";