CREATE TYPE "public"."notification_channel" AS ENUM('inApp', 'email', 'whatsapp', 'push');--> statement-breakpoint
CREATE TYPE "public"."notification_preference_category" AS ENUM('global', 'general', 'leads', 'projects', 'tasks', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_preference_source" AS ENUM('default', 'user', 'override');--> statement-breakpoint
CREATE TABLE "notification_channel_overrides" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"category" "notification_preference_category" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enforced" boolean DEFAULT true NOT NULL,
	"reason" text,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" "notification_preference_category" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"delivery_window" jsonb DEFAULT 'null'::jsonb,
	"source" "notification_preference_source" DEFAULT 'default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_channel_overrides_category_channel" ON "notification_channel_overrides" USING btree ("category","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_notification_preferences_user_category_channel" ON "user_notification_preferences" USING btree ("user_id","category","channel");--> statement-breakpoint
CREATE INDEX "idx_user_notification_preferences_category" ON "user_notification_preferences" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_user_notification_preferences_channel" ON "user_notification_preferences" USING btree ("channel");