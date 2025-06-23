CREATE TABLE "kv_store" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "observability_events" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"request_id" varchar(25),
	"endpoint" varchar(255),
	"method" varchar(10),
	"status_code" integer,
	"response_time_ms" integer,
	"error_message" text,
	"stack_trace" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_details" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"request_id" varchar(25) NOT NULL,
	"user_id" text,
	"method" varchar(10) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"query_params" jsonb,
	"request_body" jsonb,
	"response_body" jsonb,
	"request_headers" jsonb,
	"response_headers" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "request_details_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE INDEX "observability_events_timestamp_idx" ON "observability_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "observability_events_user_id_idx" ON "observability_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "observability_events_event_type_idx" ON "observability_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "observability_events_request_id_idx" ON "observability_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "observability_events_endpoint_idx" ON "observability_events" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "observability_events_created_at_idx" ON "observability_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "request_details_request_id_idx" ON "request_details" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_details_user_id_idx" ON "request_details" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "request_details_endpoint_idx" ON "request_details" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "request_details_created_at_idx" ON "request_details" USING btree ("created_at");