ALTER TABLE "permissions_to_users" RENAME COLUMN "id" TO "userId";--> statement-breakpoint
ALTER TABLE "permissions_to_users" DROP CONSTRAINT "permissions_to_users_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions_to_users" DROP CONSTRAINT "permissions_to_users_id_permissions_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions_to_users" DROP CONSTRAINT "permissions_to_users_id_id_pk";--> statement-breakpoint
ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_userId_permissionId_pk" PRIMARY KEY("userId","permissionId");--> statement-breakpoint
ALTER TABLE "permissions_to_users" ADD COLUMN "permissionId" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
