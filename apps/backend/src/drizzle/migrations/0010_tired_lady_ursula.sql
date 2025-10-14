CREATE TYPE "public"."notification_status" AS ENUM('unread', 'read');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('informational', 'approval');--> statement-breakpoint
CREATE TABLE "notification_action_logs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"notification_id" varchar(25) NOT NULL,
	"action_key" varchar(50) NOT NULL,
	"acted_by" text NOT NULL,
	"comment" text,
	"acted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_actions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"notification_id" varchar(25) NOT NULL,
	"action_key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"requires_comment" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "notification_status" DEFAULT 'unread' NOT NULL,
	"category" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"group_key" date
);
--> statement-breakpoint
ALTER TABLE "notification_action_logs" ADD CONSTRAINT "notification_action_logs_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_action_logs" ADD CONSTRAINT "notification_action_logs_acted_by_users_id_fk" FOREIGN KEY ("acted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_actions" ADD CONSTRAINT "notification_actions_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notification_action_logs_notification_id" ON "notification_action_logs" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "idx_notification_actions_notification_id" ON "notification_actions" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_status" ON "notifications" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_notifications_group_key" ON "notifications" USING btree ("user_id","group_key");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("user_id","created_at");