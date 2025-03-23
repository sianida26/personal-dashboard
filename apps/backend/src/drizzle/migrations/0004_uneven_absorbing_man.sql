CREATE TABLE "microsoft_admin_tokens" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token_type" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scope" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
