ALTER TABLE "permissions_to_roles" DROP CONSTRAINT "permissions_to_roles_roleId_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions_to_roles" DROP CONSTRAINT "permissions_to_roles_permissionId_permissions_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions_to_users" DROP CONSTRAINT "permissions_to_users_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions_to_users" DROP CONSTRAINT "permissions_to_users_permissionId_permissions_id_fk";
--> statement-breakpoint
ALTER TABLE "roles_to_users" DROP CONSTRAINT "roles_to_users_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "roles_to_users" DROP CONSTRAINT "roles_to_users_roleId_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions_to_roles" ADD CONSTRAINT "permissions_to_roles_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions_to_roles" ADD CONSTRAINT "permissions_to_roles_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions_to_users" ADD CONSTRAINT "permissions_to_users_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles_to_users" ADD CONSTRAINT "roles_to_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles_to_users" ADD CONSTRAINT "roles_to_users_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;