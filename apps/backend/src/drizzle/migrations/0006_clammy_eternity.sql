CREATE TABLE "dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "errors" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"trace_id" varchar(32),
	"span_id" varchar(16),
	"title" varchar(255) NOT NULL,
	"message" text,
	"stack_trace" text,
	"fingerprint" varchar(64),
	"level" varchar(20) DEFAULT 'error',
	"source" varchar(20),
	"service_name" varchar(100),
	"url" text,
	"user_agent" text,
	"user_id" varchar(100),
	"session_id" varchar(100),
	"context" jsonb,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"status" varchar(20) DEFAULT 'unresolved'
);
--> statement-breakpoint
CREATE TABLE "kv_store" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"trace_id" varchar(32),
	"span_id" varchar(16),
	"timestamp" timestamp NOT NULL,
	"severity_text" varchar(20),
	"severity_number" integer,
	"body" text,
	"service_name" varchar(100) NOT NULL,
	"service_version" varchar(50),
	"attributes" jsonb,
	"resource_attributes" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"metric_name" varchar(255) NOT NULL,
	"metric_type" varchar(20) NOT NULL,
	"metric_value" numeric NOT NULL,
	"timestamp" timestamp NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"service_version" varchar(50),
	"attributes" jsonb,
	"resource_attributes" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_members_project_id_user_id_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"api_key" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"max_spans_per_hour" integer DEFAULT 100000,
	"max_metrics_per_hour" integer DEFAULT 50000,
	"max_logs_per_hour" integer DEFAULT 200000,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "traces" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"trace_id" varchar(32) NOT NULL,
	"span_id" varchar(16) NOT NULL,
	"parent_span_id" varchar(16),
	"operation_name" varchar(255) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_ms" integer,
	"status_code" integer DEFAULT 0,
	"status_message" text,
	"service_name" varchar(100) NOT NULL,
	"service_version" varchar(50),
	"tags" jsonb,
	"logs" jsonb,
	"resource_attributes" jsonb,
	"is_root" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "errors" ADD CONSTRAINT "errors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "errors_project_time_idx" ON "errors" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "errors_fingerprint_idx" ON "errors" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "errors_status_idx" ON "errors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "errors_level_idx" ON "errors" USING btree ("level");--> statement-breakpoint
CREATE INDEX "errors_project_status_idx" ON "errors" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "errors_trace_id_idx" ON "errors" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "logs_project_time_idx" ON "logs" USING btree ("project_id","timestamp");--> statement-breakpoint
CREATE INDEX "logs_severity_idx" ON "logs" USING btree ("severity_text");--> statement-breakpoint
CREATE INDEX "logs_trace_id_idx" ON "logs" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "logs_service_name_idx" ON "logs" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "logs_project_service_idx" ON "logs" USING btree ("project_id","service_name");--> statement-breakpoint
CREATE INDEX "metrics_project_time_idx" ON "metrics" USING btree ("project_id","timestamp");--> statement-breakpoint
CREATE INDEX "metrics_name_idx" ON "metrics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "metrics_service_name_idx" ON "metrics" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "metrics_project_metric_idx" ON "metrics" USING btree ("project_id","metric_name");--> statement-breakpoint
CREATE INDEX "traces_project_time_idx" ON "traces" USING btree ("project_id","start_time");--> statement-breakpoint
CREATE INDEX "traces_trace_id_idx" ON "traces" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "traces_service_name_idx" ON "traces" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "traces_status_code_idx" ON "traces" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "traces_project_service_idx" ON "traces" USING btree ("project_id","service_name");