ALTER TABLE "observability_events" ADD COLUMN "route_path" varchar(255);--> statement-breakpoint
ALTER TABLE "request_details" ADD COLUMN "route_path" varchar(255);