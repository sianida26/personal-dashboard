# Quick Reference

This document provides quick access to commonly used commands, patterns, and examples.

## Essential Commands

### Development Commands
```bash
# Start development server
bun dev

# Run tests (use 'run' prefix for test command)
bun run test

# Run linter
bun lint

# Format code
bun format
```

### Database Commands
```bash
# Generate migration
bun db:generate

# Run migrations
bun db:migrate

# Run seeders
bun db:seed

# Open Drizzle Studio
bun db:studio

# Reset database (development only)
bun db:reset
```

### File Generators
```bash
# Generate new schema
turbo gen add-schema

# Generate new CRUD endpoints (creates multiple endpoint files)
turbo gen basic-crud
```

## Common Patterns

### Endpoint Template
```typescript
// src/routes/resource/get-resource.ts
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { paginationRequestSchema } from "@repo/validation";
import { badRequest, notFound } from "../../errors/DashboardError";

const getResourceEndpoint = createHonoRoute()
  .use(authInfo)
  .get(
    "/resource",
    checkPermission("resource.read"),
    requestValidator("query", paginationRequestSchema),
    async (c) => {
      const { page, limit } = c.req.valid("query");
      
      // Validation - THROW on error
      if (page < 1) {
        throw badRequest({ message: "Page must be greater than 0" });
      }
      
      // Business logic
      const resources = await db.query.resource.findMany({
        limit,
        offset: (page - 1) * limit
      });
      
      // SINGLE RETURN
      return c.json({
        data: resources,
        _metadata: {
          totalItems: resources.length,
          currentPage: page
        }
      });
    }
  );

export default getResourceEndpoint;
```

### CRUD Endpoint Examples
```typescript
// CRUD endpoints for a resource create:
// src/routes/products/
// ├── get-products.ts         # GET /products (list)
// ├── post-products.ts        # POST /products (create)  
// ├── get-product-by-id.ts    # GET /products/:id (read)
// ├── put-product-by-id.ts    # PUT /products/:id (update)
// └── delete-product-by-id.ts # DELETE /products/:id (delete)

// CREATE
const createProductEndpoint = createHonoRoute()
  .use(authInfo)
  .post(
    "/products",
    checkPermission("products.create"),
    requestValidator("json", productSchema),
    async (c) => {
      const productData = c.req.valid("json");
      
      // Validation
      const existing = await db.query.products.findFirst({
        where: eq(products.name, productData.name)
      });
      
      if (existing) {
        throw badRequest({
          message: "Product already exists",
          formErrors: { name: "Product name must be unique" }
        });
      }
      
      // Create
      const [product] = await db.insert(products).values(productData).returning();
      
      return c.json({ data: product }, 201);
    }
  );

// READ
const getProductEndpoint = createHonoRoute()
  .use(authInfo)
  .get(
    "/products/:id",
    checkPermission("products.read"),
    async (c) => {
      const id = c.req.param("id");
      
      if (!id) {
        throw badRequest({ message: "Product ID is required" });
      }
      
      const product = await db.query.products.findFirst({
        where: eq(products.id, id)
      });
      
      if (!product) {
        throw notFound({ message: "Product not found" });
      }
      
      return c.json({ data: product });
    }
  );

// UPDATE
const updateProductEndpoint = createHonoRoute()
  .use(authInfo)
  .put(
    "/products/:id",
    checkPermission("products.update"),
    requestValidator("json", productUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const updateData = c.req.valid("json");
      
      const [product] = await db.update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      
      if (!product) {
        throw notFound({ message: "Product not found" });
      }
      
      return c.json({ data: product });
    }
  );

// DELETE
const deleteProductEndpoint = createHonoRoute()
  .use(authInfo)
  .delete(
    "/products/:id",
    checkPermission("products.delete"),
    async (c) => {
      const id = c.req.param("id");
      
      const product = await db.query.products.findFirst({
        where: eq(products.id, id)
      });
      
      if (!product) {
        throw notFound({ message: "Product not found" });
      }
      
      await db.delete(products).where(eq(products.id, id));
      
      return c.json({ message: "Product deleted successfully" });
    }
  );
```

## Database Patterns

### Schema Template
```typescript
// src/drizzle/schema/my-table.ts
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const myTableSchema = pgTable("my_table", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const myTableRelations = relations(myTableSchema, ({ many, one }) => ({
  // Define relations here
  relatedItems: many(relatedItemsSchema),
  parent: one(parentSchema, {
    fields: [myTableSchema.parentId],
    references: [parentSchema.id]
  })
}));
```

### Common Query Patterns
```typescript
// Basic queries
const findAll = () => db.query.table.findMany();
const findById = (id: string) => db.query.table.findFirst({
  where: eq(table.id, id)
});

// With relations
const findWithRelations = (id: string) => db.query.table.findFirst({
  where: eq(table.id, id),
  with: {
    relations: true
  }
});

// Pagination
const findPaginated = (page: number, limit: number) => db.query.table.findMany({
  limit,
  offset: (page - 1) * limit,
  orderBy: desc(table.createdAt)
});

// Complex query
const complexQuery = () => db
  .select()
  .from(table)
  .leftJoin(relatedTable, eq(table.id, relatedTable.tableId))
  .where(and(
    eq(table.isActive, true),
    isNotNull(table.name)
  ));
```

## Validation Patterns

### Common Schemas
```typescript
// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Search
export const searchSchema = z.object({
  q: z.string().optional(),
  filter: z.array(z.object({
    id: z.string(),
    value: z.string()
  })).optional(),
  sort: z.array(z.object({
    id: z.string(),
    desc: z.boolean()
  })).optional(),
});

// User schemas
export const userCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  isEnabled: z.boolean().default(true),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });
```

## Testing Patterns

### Test Template
```typescript
// src/routes/resource/get-resource.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createUserForTesting, cleanupTestUser } from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/hono-test-client";

describe("GET /resource", () => {
  let testUser: Awaited<ReturnType<typeof createUserForTesting>>;

  beforeAll(async () => {
    testUser = await createUserForTesting({
      permissions: ["resource.read"]
    });
  });

  afterAll(async () => {
    await cleanupTestUser(testUser.user.id);
  });

  test("should return resource list", async () => {
    const response = await client.resource.$get({
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("should deny access without permission", async () => {
    const limitedUser = await createUserForTesting({
      permissions: []
    });

    const response = await client.resource.$get({
      headers: {
        Authorization: `Bearer ${limitedUser.accessToken}`
      }
    });

    expect(response.status).toBe(403);
    
    await cleanupTestUser(limitedUser.user.id);
  });
});
```

## Error Handling Patterns

### Standard Error Responses
```typescript
import { badRequest, notFound, forbidden, unauthorized, conflict } from "../errors/DashboardError";

// Validation error
throw badRequest({
  message: "Invalid input data",
  formErrors: {
    email: "Invalid email format",
    password: "Password too short"
  }
});

// Resource not found
throw notFound({ message: "User not found" });

// Permission denied
throw forbidden({ message: "Insufficient permissions" });

// Authentication required
throw unauthorized({ message: "Authentication required" });

// Resource conflict
throw conflict({ message: "Email already exists" });
```

## Middleware Patterns

### Custom Middleware
```typescript
// src/middlewares/my-middleware.ts
import { createMiddleware } from "hono/factory";
import type HonoEnv from "../types/HonoEnv";

const myMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  // Pre-processing
  const start = Date.now();
  
  await next();
  
  // Post-processing
  const duration = Date.now() - start;
  c.header("X-Response-Time", `${duration}ms`);
});

export default myMiddleware;
```

## Service Patterns

### Service Class Template
```typescript
// src/services/my-service.ts
export class MyService {
  async getAll(): Promise<MyResource[]> {
    return await db.query.myResource.findMany();
  }

  async getById(id: string): Promise<MyResource | null> {
    return await db.query.myResource.findFirst({
      where: eq(myResource.id, id)
    });
  }

  async create(data: CreateMyResourceType): Promise<MyResource> {
    const [resource] = await db.insert(myResource).values(data).returning();
    return resource;
  }

  async update(id: string, data: UpdateMyResourceType): Promise<MyResource | null> {
    const [resource] = await db.update(myResource)
      .set(data)
      .where(eq(myResource.id, id))
      .returning();
    return resource;
  }

  async delete(id: string): Promise<void> {
    await db.delete(myResource).where(eq(myResource.id, id));
  }
}

export const myService = new MyService();
```

## Logging Patterns

### Standard Logging
```typescript
import appLogger from "../utils/logger";

// In endpoints
appLogger.info("Processing request", c);
appLogger.error("Request failed", c);
appLogger.debug("Debug information", c);

// With context
appLogger.info(`User ${userId} performed action`, c);
appLogger.error(`Failed to process ${itemCount} items`, c);
```

## Environment Patterns

### Environment Configuration
```typescript
// src/appEnv.ts
const appEnv = {
  APP_ENV: process.env.APP_ENV || "development",
  APP_PORT: parseInt(process.env.APP_PORT || "3000"),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

export default appEnv;
```

## File Structure Examples

### Typical Resource Structure
```
src/routes/users/
├── get-users.ts              # GET /users
├── get-users.test.ts         # Tests for GET /users
├── post-users.ts             # POST /users
├── post-users.test.ts        # Tests for POST /users
├── get-user-by-id.ts         # GET /users/:id
├── get-user-by-id.test.ts    # Tests for GET /users/:id
├── put-user-by-id.ts         # PUT /users/:id
├── put-user-by-id.test.ts    # Tests for PUT /users/:id
├── delete-user-by-id.ts      # DELETE /users/:id
└── delete-user-by-id.test.ts # Tests for DELETE /users/:id
```

### Schema Structure
```
src/drizzle/schema/
├── users.ts                  # User table schema
├── roles.ts                  # Role table schema
├── permissions.ts            # Permission table schema
├── roles-to-users.ts         # Many-to-many relation
├── permissions-to-roles.ts   # Many-to-many relation
└── oauth-google.ts           # Google OAuth schema
```

## Permission Patterns

### Common Permissions
```typescript
// Resource-based permissions
"users.read"         // Read users
"users.write"        // Create/update users
"users.delete"       // Delete users
"roles.read"         // Read roles
"roles.write"        // Create/update roles
"admin.access"       // Admin panel access
"all"               // Super admin (all permissions)
```

### Permission Checks
```typescript
// Single permission
checkPermission("users.read")

// Multiple permissions (OR logic)
protect(["users.read", "users.readAll"])

// Custom permission logic
const hasAdminAccess = (user: User) => {
  return user.permissions.includes("all") || 
         user.permissions.includes("admin.access");
};
```

## Related Documentation

- [Common Development Tasks](development-tasks.md) - Step-by-step guides
- [Route Development](routes.md) - Detailed endpoint patterns
- [Database Layer](database.md) - Database patterns
- [Testing](testing.md) - Testing patterns
- [Best Practices](best-practices.md) - Coding standards
