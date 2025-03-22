CREATE TABLE "microsoft_users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" text,
	"microsoft_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" varchar(255);--> statement-breakpoint
ALTER TABLE "microsoft_users" ADD CONSTRAINT "microsoft_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;