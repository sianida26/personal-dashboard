import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export async function up(db: any): Promise<void> {
  await db.schema.createTable("app_settings")
    .addColumn("id", text("id").primaryKey().notNull())
    .addColumn("key", text("key").notNull().unique())
    .addColumn("value", text("value").notNull())
    .addColumn("created_at", timestamp("created_at").defaultNow())
    .addColumn("updated_at", timestamp("updated_at").defaultNow())
    .execute();
}

export async function down(db: any): Promise<void> {
  await db.schema.dropTable("app_settings").execute();
} 