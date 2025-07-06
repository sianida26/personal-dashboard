CREATE TABLE "job_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"error_message" text,
	"worker_id" varchar(50),
	"execution_time_ms" integer,
	"memory_usage_mb" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"cron_expression" varchar(100) NOT NULL,
	"payload" json DEFAULT '{}'::json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC',
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text,
	CONSTRAINT "job_schedules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"payload" json NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text,
	"worker_id" varchar(50),
	"timeout_seconds" integer DEFAULT 300,
	"tags" json DEFAULT '[]'::json
);
--> statement-breakpoint
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;