import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { observabilityEvents } from "./observability-events";

export const requestDetails = pgTable(
	"request_details",
	{
		id: varchar("id", { length: 25 })
			.primaryKey()
			.$defaultFn(() => createId()),
		requestId: varchar("request_id", { length: 25 }).notNull().unique(),
		userId: text("user_id"), // nullable
		method: varchar("method", { length: 10 }).notNull(),
		endpoint: varchar("endpoint", { length: 255 }).notNull(),
		queryParams: jsonb("query_params"),
		requestBody: jsonb("request_body"),
		responseBody: jsonb("response_body"),
		requestHeaders: jsonb("request_headers"), // selected request headers only
		responseHeaders: jsonb("response_headers"), // selected response headers only
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
	},
	(table) => ({
		// Indexes for performance
		requestIdIdx: index("request_details_request_id_idx").on(
			table.requestId,
		),
		userIdIdx: index("request_details_user_id_idx").on(table.userId),
		endpointIdx: index("request_details_endpoint_idx").on(table.endpoint),
		createdAtIdx: index("request_details_created_at_idx").on(
			table.createdAt,
		),
	}),
);

export const requestDetailsRelations = relations(
	requestDetails,
	({ one, many }) => ({
		user: one(users, {
			fields: [requestDetails.userId],
			references: [users.id],
		}),
		observabilityEvents: many(observabilityEvents),
	}),
);
