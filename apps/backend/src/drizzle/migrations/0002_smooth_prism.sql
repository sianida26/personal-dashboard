CREATE TABLE IF NOT EXISTS "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions_to_users" (
	"id" text NOT NULL,
	CONSTRAINT "permissions_to_users_id_id_pk" PRIMARY KEY("id","id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_id_permissions_id_fk" FOREIGN KEY ("id") REFERENCES "permissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
