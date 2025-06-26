import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const observabilityEvents = pgTable(
	"observability_events",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		eventType: varchar("event_type", { length: 50 }).notNull(), // 'api_request', 'frontend_error', 'frontend_metric'
		timestamp: timestamp("timestamp", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
		userId: text("user_id"), // nullable for anonymous requests
		requestId: varchar("request_id", { length: 25 }), // correlation with existing request logs
		endpoint: varchar("endpoint", { length: 255 }), // API endpoint or frontend route
		method: varchar("method", { length: 10 }), // HTTP method for API requests
		statusCode: integer("status_code"), // HTTP status code
		responseTimeMs: integer("response_time_ms"), // response time in milliseconds
		errorMessage: text("error_message"), // error message if applicable
		stackTrace: text("stack_trace"), // full stack trace for errors
		metadata: jsonb("metadata"), // flexible storage for additional context
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => ({
		// Indexes for performance
		timestampIdx: index("observability_events_timestamp_idx").on(
			table.timestamp,
		),
		userIdIdx: index("observability_events_user_id_idx").on(table.userId),
		eventTypeIdx: index("observability_events_event_type_idx").on(
			table.eventType,
		),
		requestIdIdx: index("observability_events_request_id_idx").on(
			table.requestId,
		),
		endpointIdx: index("observability_events_endpoint_idx").on(
			table.endpoint,
		),
		createdAtIdx: index("observability_events_created_at_idx").on(
			table.createdAt,
		),
	}),
);

export const observabilityEventsRelations = relations(
	observabilityEvents,
	({ one }) => ({
		user: one(users, {
			fields: [observabilityEvents.userId],
			references: [users.id],
		}),
	}),
);
