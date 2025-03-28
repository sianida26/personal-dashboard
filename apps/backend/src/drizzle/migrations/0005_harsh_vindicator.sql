CREATE TABLE "oauth_google" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" text,
	"provider_id" varchar(255) NOT NULL,
	"name" text,
	"given_name" text,
	"family_name" text,
	"access_token" text,
	"refresh_token" text,
	"locale" varchar(255),
	"email" text,
	"profile_picture_url" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "microsoft_users" RENAME TO "oauth_microsoft";--> statement-breakpoint
ALTER TABLE "oauth_microsoft" RENAME COLUMN "microsoft_id" TO "provider_id";--> statement-breakpoint
ALTER TABLE "oauth_microsoft" DROP CONSTRAINT "microsoft_users_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ALTER COLUMN "id" SET DATA TYPE varchar(25);--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ALTER COLUMN "access_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "given_name" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "surname" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "user_principal_name" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "mobile_phone" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "office_location" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "preferred_language" varchar(255);--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "profile_picture_url" text;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "oauth_google" ADD CONSTRAINT "oauth_google_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_microsoft" ADD CONSTRAINT "oauth_microsoft_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "job_title";