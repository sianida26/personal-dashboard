CREATE TABLE IF NOT EXISTS "permissions_to_roles" (
	"roleId" text NOT NULL,
	"permissionId" text NOT NULL,
	CONSTRAINT "permissions_to_roles_roleId_permissionId_pk" PRIMARY KEY("roleId","permissionId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles_to_users" (
	"userId" text NOT NULL,
	"roleId" text NOT NULL,
	CONSTRAINT "roles_to_users_userId_roleId_pk" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_roles" ADD CONSTRAINT "permissions_to_roles_roleId_users_id_fk" FOREIGN KEY ("roleId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions_to_roles" ADD CONSTRAINT "permissions_to_roles_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles_to_users" ADD CONSTRAINT "roles_to_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles_to_users" ADD CONSTRAINT "roles_to_users_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
