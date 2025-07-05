# Common Development Tasks

This document provides step-by-step guides for common development tasks in the backend.

## 1. Adding a New Endpoint

### Step 1: Create Endpoint File

```typescript
// src/routes/products/get-products.ts
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { paginationRequestSchema } from "@repo/validation";

const getProductsEndpoint = createHonoRoute()
  .use(authInfo)
  .get(
    "/products",  // Complete path defined here
    checkPermission("products.read"),
    requestValidator("query", paginationRequestSchema),
    async (c) => {
      const { page, limit } = c.req.valid("query");
      
      // Validation - THROW on error, don't return
      if (page < 1) {
        throw badRequest({ message: "Page must be greater than 0" });
      }
      
      if (limit > 100) {
        throw badRequest({ message: "Limit cannot exceed 100" });
      }
      
      // Business logic here...
      const products = await db.query.products.findMany({
        limit,
        offset: (page - 1) * limit
      });
      
      // ONLY ONE RETURN - at the end
      return c.json({ 
        data: products, 
        _metadata: { totalItems: 0, totalPages: 0, currentPage: page } 
      });
    }
  );

export default getProductsEndpoint;
```

### Step 2: Register in Main App

```typescript
// src/index.ts
import getProductsEndpoint from "./routes/products/get-products";
import postProductsEndpoint from "./routes/products/post-products";

const appRoutes = app
  .use(requestLogger)
  .use(cors({ origin: "*" }))
  .use(rateLimiter({ /* ... */ }))
  .use(authTokenMiddleware)
  // Register individual endpoints
  .route("/", getProductsEndpoint)
  .route("/", postProductsEndpoint)
  // ... other endpoints
  .get("/test", (c) => c.json({ message: "Server is up" }));
```

### Step 3: Endpoint File Organization

```
src/routes/products/
├── get-products.ts          # GET /products
├── post-products.ts         # POST /products
├── get-product-by-id.ts     # GET /products/:id
├── put-product-by-id.ts     # PUT /products/:id
├── delete-product-by-id.ts  # DELETE /products/:id
└── get-product-reviews.ts   # GET /products/:id/reviews
```

## 2. Adding a New Database Table

### Step 1: Create Schema File

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

### Step 2: Register Schema

```typescript
// src/drizzle/index.ts
import * as myTableSchema from "./schema/my-table";  // kebab-case import

const db = drizzle({
  schema: {
    // ... existing schemas
    ...myTableSchema,
  },
});
```

### Step 3: Generate Migration

```bash
bun db:generate
```

### Step 4: Apply Migration

```bash
bun db:migrate
```

## 3. Adding New Middleware

```typescript
// src/middlewares/my-middleware.ts (kebab-case)
import { createMiddleware } from "hono/factory";
import type HonoEnv from "../types/HonoEnv";

const myMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  // Pre-processing logic
  console.log("Before request");
  
  await next();
  
  // Post-processing logic
  console.log("After request");
});

export default myMiddleware;
```

## 4. Adding New Validation Schema

### Step 1: Create Schema in Validation Package

```typescript
// packages/validation/src/schemas/my-schema.ts
import { z } from "zod";

export const mySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(18, "Must be at least 18 years old"),
});

export type MySchemaType = z.infer<typeof mySchema>;
```

### Step 2: Export from Validation Package

```typescript
// packages/validation/src/index.ts
export { mySchema, type MySchemaType } from "./schemas/my-schema";
```

### Step 3: Use in Endpoint

```typescript
// src/routes/my-resource/post-my-resource.ts
import { mySchema } from "@repo/validation";

const createMyResourceEndpoint = createHonoRoute()
  .use(authInfo)
  .post(
    "/my-resource",
    requestValidator("json", mySchema),
    async (c) => {
      const data = c.req.valid("json"); // Type-safe!
      // data.name, data.email, data.age are all typed
      return c.json({ data: newResource }, 201);
    }
  );
```

## 5. Adding New Permission

### Step 1: Add Permission to Database

```typescript
// src/drizzle/seeds/permissions.ts
const permissions = [
  // ... existing permissions
  {
    code: "products.read",
    name: "Read Products",
    description: "View product listings"
  },
  {
    code: "products.write",
    name: "Write Products",
    description: "Create and edit products"
  },
  {
    code: "products.delete",
    name: "Delete Products",
    description: "Delete products"
  }
];
```

### Step 2: Run Seeds

```bash
bun db:seed
```

### Step 3: Use in Endpoints

```typescript
// src/routes/products/get-products.ts
const getProductsEndpoint = createHonoRoute()
  .use(authInfo)
  .get(
    "/products",
    checkPermission("products.read"), // Use new permission
    async (c) => {
      // Route logic
    }
  );
```

## 6. Adding New Service

```typescript
// src/services/my-service/index.ts
import db from "../../drizzle";
import { myTable } from "../../drizzle/schema/my-table";

export class MyService {
  async getAll() {
    return await db.query.myTable.findMany();
  }

  async getById(id: string) {
    return await db.query.myTable.findFirst({
      where: eq(myTable.id, id)
    });
  }

  async create(data: CreateMyResourceType) {
    const [result] = await db.insert(myTable).values(data).returning();
    return result;
  }

  async update(id: string, data: UpdateMyResourceType) {
    const [result] = await db.update(myTable)
      .set(data)
      .where(eq(myTable.id, id))
      .returning();
    return result;
  }

  async delete(id: string) {
    await db.delete(myTable).where(eq(myTable.id, id));
  }
}

export const myService = new MyService();
```

## 7. Adding New Utility Function

```typescript
// src/utils/my-utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

## 8. Adding Environment Variable

### Step 1: Add to appEnv.ts

```typescript
// src/appEnv.ts
const appEnv = {
  // ... existing variables
  MY_NEW_VARIABLE: process.env.MY_NEW_VARIABLE || "default_value",
  
  // With Zod validation
  MY_VALIDATED_VARIABLE: z.string().min(1).parse(process.env.MY_VALIDATED_VARIABLE),
};
```

### Step 2: Add to .env File

```bash
# .env
MY_NEW_VARIABLE=some_value
MY_VALIDATED_VARIABLE=validated_value
```

### Step 3: Use in Code

```typescript
import appEnv from "../appEnv";

const myFunction = () => {
  const value = appEnv.MY_NEW_VARIABLE;
  // Use the value
};
```

## 9. Adding New Test

```typescript
// src/routes/my-resource/get-my-resource.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createUserForTesting, cleanupTestUser } from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/hono-test-client";

describe("GET /my-resource", () => {
  let testUser: Awaited<ReturnType<typeof createUserForTesting>>;

  beforeAll(async () => {
    testUser = await createUserForTesting({
      name: "Test User",
      username: "test-user",
      permissions: ["myresource.read"]
    });
  });

  afterAll(async () => {
    await cleanupTestUser(testUser.user.id);
  });

  test("should return my resources", async () => {
    const response = await client.myResource.$get({
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
  });
});
```

## 10. Adding New Error Type

```typescript
// src/errors/DashboardError.ts
export class DashboardError extends Error {
  // ... existing code

  static customError(message: string, details?: any) {
    return new DashboardError(message, 422, "CUSTOM_ERROR", details);
  }
}

// Export convenience function
export const customError = DashboardError.customError;
```

## Quick Commands Reference

```bash
# Development
bun dev                 # Start development server
bun run test           # Run tests
bun lint               # Run linter
bun format             # Format code

# Database
bun db:generate        # Generate migration
bun db:migrate         # Run migrations
bun db:seed            # Run seeders
bun db:studio          # Open Drizzle Studio

# Generators
turbo gen add-schema   # Generate new schema
turbo gen basic-crud   # Generate CRUD endpoints
```

## Related Documentation

- [Route Development](routes.md) - Detailed endpoint patterns
- [Database Layer](database.md) - Database schema and migrations
- [Testing](testing.md) - Testing patterns and utilities
- [Best Practices](best-practices.md) - Coding standards and conventions
