ALTER TABLE "permissions_to_roles" DROP CONSTRAINT "permissions_to_roles_roleId_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_roles" ADD CONSTRAINT "permissions_to_roles_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
