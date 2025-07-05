# Database Layer (Drizzle ORM)

This document covers the database layer implementation using Drizzle ORM with PostgreSQL.

## Critical Rules for Database Work

⚠️ **MUST READ**: Before making any database changes, refer to `/apps/backend/src/drizzle/README.md`

## Key Conventions

### 1. Schema Files
- **One file per table** in `schema/` directory
- **Kebab-case** file names (e.g., `user-profile.ts`, `oauth-google.ts`)

### 2. Naming Conventions
- **Tables**: `snake_case`, plural (e.g., `users`, `roles_to_users`)
- **Schema variables**: `[modelName]Schema` (e.g., `rolesSchema`)
- **Relations**: `[modelName]Relations` (e.g., `rolesRelations`)
- **Files**: `kebab-case` (e.g., `user-profile.ts`, `oauth-google.ts`)

### 3. Primary Keys
- **All primary keys use CUID2** with 25-character varchar (`varchar(25)`)
- This is the default for all ID fields
- Generated using `@paralleldrive/cuid2`

### 4. Relations
- **Always explicitly define relations** using `relations()` helper
- Define both sides of the relationship
- Use proper foreign key constraints

### 5. Migrations
- **Auto-generated** - DO NOT edit migration files manually
- Use `bun db:generate` to create migrations
- Use `bun db:migrate` to apply migrations

## Database Schema Structure

```
- users (main user table)
- roles (role definitions)
- permissions (permission definitions)
- roles_to_users (many-to-many: users ↔ roles)
- permissions_to_roles (many-to-many: permissions ↔ roles)
- permissions_to_users (many-to-many: users ↔ permissions)
- oauth_google (Google OAuth data)
- oauth_microsoft (Microsoft OAuth data)
- app_settings (application configuration)
- kv_store (key-value storage)
```

## Permission System

### Role-Based Access Control (RBAC)
- **Roles**: Groups of permissions (e.g., "admin", "user", "editor")
- **Permissions**: Granular access rights (e.g., "users.read", "users.write")
- **Inheritance**: Users can have direct permissions + role-based permissions
- **Checking**: Use `checkPermission()` middleware or `protect()` for route protection

### Permission Patterns
- `resource.read` / `resource.readAll` - Read access
- `resource.write` / `resource.create` / `resource.update` - Write access
- `resource.delete` - Delete access
- `all` - Super admin access (special permission)

## Database Query Patterns

### Basic Query
```typescript
const users = await db.query.users.findMany({
  where: eq(users.isEnabled, true),
  limit: 10,
});
```

### Query with Relations
```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    rolesToUsers: {
      with: {
        role: true,
      },
    },
  },
});
```

### Complex Query with Drizzle
```typescript
const result = await db
  .select()
  .from(users)
  .leftJoin(rolesToUsers, eq(users.id, rolesToUsers.userId))
  .where(and(
    eq(users.isEnabled, true),
    isNull(users.deletedAt)
  ))
  .orderBy(desc(users.createdAt))
  .limit(limit)
  .offset((page - 1) * limit);
```

## Schema Example

### Creating a Schema File
```typescript
// src/drizzle/schema/my-table.ts (kebab-case)
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const myTableSchema = pgTable("my_table", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()), // Creates 25-character CUID2 string
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const myTableRelations = relations(myTableSchema, ({ many }) => ({
  // Define relations here
}));
```

### Registering Schema
```typescript
// src/drizzle/index.ts
import * as myTableSchema from "./schema/my-table";  // kebab-case import

const db = drizzle({
  schema: {
    // ...existing schemas
    ...myTableSchema,
  },
});
```

## Migration Workflow

### 1. Create/Modify Schema
Make changes to schema files in `src/drizzle/schema/`

### 2. Generate Migration
```bash
bun db:generate
```

### 3. Apply Migration
```bash
bun db:migrate
```

### 4. Verify Migration
Check that the migration was applied correctly and database structure matches expectations.

## Best Practices

### Schema Design
- Use appropriate data types for fields
- Add NOT NULL constraints where appropriate
- Define proper foreign key relationships
- Use indexes for frequently queried columns

### Query Performance
- Use `with` clauses for efficient relation loading
- Implement proper pagination
- Use database indexes on frequently queried columns
- Monitor SQL query performance

### Data Integrity
- Use transactions for multi-table operations
- Implement proper validation at database level
- Use foreign key constraints to maintain referential integrity
- Consider soft deletes for important data

## Common Database Operations

### Creating Records
```typescript
const [newUser] = await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
  password: hashedPassword
}).returning();
```

### Updating Records
```typescript
await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, userId));
```

### Deleting Records
```typescript
// Hard delete
await db.delete(users).where(eq(users.id, userId));

// Soft delete (recommended for important data)
await db.update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId));
```

## Related Documentation

- [Common Development Tasks](development-tasks.md#2-adding-a-new-database-table) - Adding new tables
- [Validation & Type Safety](validation.md) - Data validation patterns
- [Troubleshooting](troubleshooting.md#database-connection-issues) - Database issues
