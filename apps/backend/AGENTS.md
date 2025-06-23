# AGENTS.md - Backend Codebase Guide for LLM Agents

## Overview

This document provides comprehensive guidance for LLM agents working with this **HonoJS + Drizzle ORM + PostgreSQL** backend codebase. The backend is part of a monorepo structure and follows strict architectural patterns for scalability and maintainability.

---

## Architecture Overview

### Tech Stack
- **Framework**: HonoJS (TypeScript-first web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Runtime**: Bun (development)
- **Package Manager**: Bun (all dependency management and script execution)
- **Authentication**: JWT tokens with role-based access control (RBAC)
- **Validation**: Zod schemas (shared via `@repo/validation`)
- **Logging**: Custom logger with file-based logging
- **Rate Limiting**: Built-in rate limiting middleware
- **OAuth**: Google & Microsoft OAuth providers

### Key Design Patterns
- **Modular endpoints** - Each endpoint is a separate file with complete path
- **Single return rule** - Each endpoint has exactly ONE return statement, all errors must throw
- **Kebab-case naming** - All files use kebab-case convention
- **Middleware-based architecture** - Authentication, authorization, logging, rate limiting
- **Type-safe environment** - Custom HonoEnv type with Variables
- **Permission-based access control** - Granular permissions system
- **Database-first approach** - Schema definitions drive API design
- **Error handling** - Custom DashboardError class for consistent error responses

---

## Project Structure

```
apps/backend/
├── src/
│   ├── index.ts                    # Main application entry point
│   ├── appEnv.ts                   # Environment configuration with Zod validation
│   ├── data/                       # Static data definitions
│   │   ├── defaultRoles.ts         # Default role definitions
│   │   └── sidebarMenus.ts         # Sidebar menu configurations
│   ├── drizzle/                    # Database layer (see detailed section below)
│   │   ├── index.ts                # Drizzle ORM initialization
│   │   ├── migration.ts            # Migration runner
│   │   ├── seed.ts                 # Seed runner
│   │   ├── schema/                 # Database schema definitions
│   │   ├── seeds/                  # Seed data files
│   │   ├── migrations/             # Auto-generated migrations (DO NOT EDIT)
│   │   └── utils/                  # Database utilities
│   ├── errors/                     # Custom error classes
│   │   └── DashboardError.ts       # Main error class with factory functions
│   ├── middlewares/                # Hono middleware functions
│   │   ├── authInfo.ts             # User authentication info loader
│   │   ├── authTokenMiddleware.ts  # JWT token validation
│   │   ├── checkPermission.ts      # Permission-based authorization
│   │   ├── protect.ts              # Route protection middleware
│   │   ├── rateLimiter.ts          # Rate limiting middleware
│   │   ├── requestLogger.ts        # HTTP request logging
│   │   └── staticFolder.ts         # Static file serving
│   ├── routes/                     # API endpoint definitions
│   │   ├── auth/                   # Authentication endpoints
│   │   │   ├── post-login.ts       # POST /auth/login
│   │   │   ├── post-logout.ts      # POST /auth/logout
│   │   │   ├── get-me.ts           # GET /auth/me
│   │   │   └── post-refresh.ts     # POST /auth/refresh
│   │   ├── dashboard/              # Dashboard-specific endpoints
│   │   │   └── get-sidebar-items.ts # GET /dashboard/sidebar-items
│   │   ├── dev/                    # Development/testing endpoints
│   │   │   └── get-test.ts         # GET /dev/test
│   │   ├── permissions/            # Permission management endpoints
│   │   │   └── get-permissions.ts  # GET /permissions
│   │   ├── roles/                  # Role management endpoints
│   │   │   ├── get-roles.ts        # GET /roles
│   │   │   ├── post-roles.ts       # POST /roles
│   │   │   └── get-role-by-id.ts   # GET /roles/:id
│   │   ├── users/                  # User management endpoints
│   │   │   ├── get-users.ts        # GET /users
│   │   │   ├── post-users.ts       # POST /users
│   │   │   ├── get-user-by-id.ts   # GET /users/:id
│   │   │   ├── put-user-by-id.ts   # PUT /users/:id
│   │   │   └── delete-user-by-id.ts # DELETE /users/:id
│   │   └── app-settings/           # Application settings endpoints
│   │       ├── get-app-settings.ts # GET /app-settings
│   │       └── put-app-setting.ts  # PUT /app-settings/:key
│   ├── services/                   # Business logic services
│   │   ├── appSettings/            # Application settings service
│   │   └── microsoft/              # Microsoft Graph API integration
│   ├── types/                      # TypeScript type definitions
│   │   ├── HonoEnv.d.ts            # Hono environment type
│   │   ├── RedisKV.d.ts            # Redis key-value type definitions
│   │   └── index.d.ts              # Exported types
│   └── utils/                      # Utility functions
│       ├── authUtils.ts            # Authentication utilities
│       ├── createHonoRoute.ts      # Route factory function
│       ├── logger.ts               # Custom logging implementation
│       ├── passwordUtils.ts        # Password hashing/validation
│       ├── redis.ts                # Redis-like KV store using Drizzle
│       └── requestValidator.ts     # Request validation helper
├── package.json                    # Dependencies and scripts
├── drizzle.config.ts              # Drizzle Kit configuration
├── biome.json                     # Code formatting/linting config
└── tsconfig.json                  # TypeScript configuration
```

---

## Database Layer (Drizzle ORM)

### Critical Rules for Database Work

⚠️ **MUST READ**: Before making any database changes, refer to `/apps/backend/src/drizzle/README.md`

#### Key Conventions:
1. **Schema Files**: One file per table in `schema/` directory
2. **Naming**: 
   - Tables: `snake_case`, plural (e.g., `users`, `roles_to_users`)
   - Schema variables: `[modelName]Schema` (e.g., `rolesSchema`)
   - Relations: `[modelName]Relations` (e.g., `rolesRelations`)
   - Files: `kebab-case` (e.g., `user-profile.ts`, `oauth-google.ts`)
3. **IDs**: All primary keys use CUID2 with 25-character varchar (`varchar(25)`) - this is the default for all ID fields
4. **Relations**: Always explicitly define relations using `relations()` helper
5. **Migrations**: Auto-generated, DO NOT edit migration files manually

#### Database Schema Structure:
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

#### Permission System:
- **Roles**: Groups of permissions (e.g., "admin", "user", "editor")
- **Permissions**: Granular access rights (e.g., "users.read", "users.write")
- **Inheritance**: Users can have direct permissions + role-based permissions
- **Checking**: Use `checkPermission()` middleware or `protect()` for route protection

---

## Route Development Patterns

### Standard Endpoint Structure:
Each endpoint should be in its own file with the complete path defined within the function:

```typescript
// src/routes/users/get-users.ts
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { paginationRequestSchema } from "@repo/validation";

const getUsersEndpoint = createHonoRoute()
  .use(authInfo)  // Load user authentication info
  .get(
    "/users",  // Complete path defined here
    checkPermission("users.read"),  // Check permissions
    requestValidator("query", paginationRequestSchema),  // Validate request
    async (c) => {
      // Route handler logic
      const { page, limit } = c.req.valid("query");
      // ... implementation
    }
  );

export default getUsersEndpoint;
```

### Endpoint File Naming Convention:
- Use **kebab-case** for all file names
- Format: `{method}-{resource}-{action?}.ts`
- Examples:
  - `get-users.ts` - GET /users
  - `post-users.ts` - POST /users  
  - `get-user-by-id.ts` - GET /users/:id
  - `put-user-by-id.ts` - PUT /users/:id
  - `delete-user-by-id.ts` - DELETE /users/:id

### Request Validation Pattern:
```typescript
// Using Zod schemas from @repo/validation
import { userFormSchema } from "@repo/validation";

// src/routes/users/post-users.ts
const createUserEndpoint = createHonoRoute()
  .use(authInfo)
  .post(
    "/users",  // Complete path here
    requestValidator("json", userFormSchema),
    async (c) => {
      const userData = c.req.valid("json");
      
      // Check for existing user - THROW on conflict
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email)
      });
      if (existingUser) {
        throw badRequest({ 
          message: "User already exists",
          formErrors: { email: "Email is already taken" }
        });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const [newUser] = await db.insert(users).values({
        ...userData,
        password: hashedPassword
      }).returning();
      
      // ONLY ONE RETURN
      return c.json({ data: newUser }, 201);
    }
  );
```

### Error Handling Pattern:
⚠️ **CRITICAL RULE**: Every endpoint must have **EXACTLY ONE RETURN STATEMENT**. All error cases must throw, never return.

```typescript
import { notFound, unauthorized, badRequest } from "../errors/DashboardError";

// src/routes/users/get-user-by-id.ts
const getUserByIdEndpoint = createHonoRoute()
  .use(authInfo)
  .get(
    "/users/:id",  // Complete path with parameter
    checkPermission("users.read"),
    async (c) => {
      const userId = c.req.param("id");
      
      // Validation - THROW on error, don't return
      if (!userId || userId.trim() === "") {
        throw badRequest({ message: "User ID is required" });
      }
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      // Error case - THROW, don't return
      if (!user) {
        throw notFound({ message: "User not found" });
      }
      
      // Additional validation - THROW on error
      if (user.deletedAt) {
        throw notFound({ message: "User has been deleted" });
      }
      
      // ONLY ONE RETURN - at the end of successful execution
      return c.json(user);
    }
  );
```

### Custom Error Examples:
```typescript
// CORRECT - Throw errors for all side cases
const createUserEndpoint = createHonoRoute()
  .use(authInfo)
  .post("/users", requestValidator("json", userFormSchema), async (c) => {
    const userData = c.req.valid("json");
    
    // Check if user already exists - THROW
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userData.email)
    });
    if (existingUser) {
      throw badRequest({ 
        message: "User already exists",
        formErrors: { email: "Email is already taken" }
      });
    }
    
    // Validate business rules - THROW
    if (userData.age < 18) {
      throw badRequest({
        message: "User must be at least 18 years old",
        formErrors: { age: "Minimum age is 18" }
      });
    }
    
    // Create user
    const hashedPassword = await hashPassword(userData.password);
    const [newUser] = await db.insert(users).values({
      ...userData,
      password: hashedPassword
    }).returning();
    
    // ONLY ONE RETURN
    return c.json({ data: newUser }, 201);
  });
```

---

## Authentication & Authorization

### Authentication Flow:
1. **JWT Tokens**: Stored in `Authorization: Bearer <token>` header
2. **Token Validation**: `authTokenMiddleware` extracts and validates JWT
3. **User Loading**: `authInfo` middleware loads user data, roles, permissions
4. **Permission Checking**: `checkPermission()` or `protect()` middleware

### Permission System:
```typescript
// Check single permission
checkPermission("users.read")

// Check multiple permissions (user must have at least one)
protect(["users.read", "users.write"])

// Available permission patterns:
// - resource.read / resource.readAll
// - resource.write / resource.create / resource.update
// - resource.delete
// - Special: "all" (super admin)
```

### HonoEnv Variables:
```typescript
type HonoEnv = {
  Variables: {
    uid?: string;  // User ID from JWT
    currentUser?: {
      name: string;
      permissions: PermissionCode[];
      roles: RoleCode[];
    };
    requestId: string;  // Unique request identifier
  };
};
```

---

## Common Development Tasks

### 1. Adding a New Endpoint

#### Step 1: Create Endpoint File
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

#### Step 2: Register in Main App
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

#### Step 3: Endpoint File Organization
```
src/routes/products/
├── get-products.ts          # GET /products
├── post-products.ts         # POST /products
├── get-product-by-id.ts     # GET /products/:id
├── put-product-by-id.ts     # PUT /products/:id
├── delete-product-by-id.ts  # DELETE /products/:id
└── get-product-reviews.ts   # GET /products/:id/reviews
```

### 2. Adding a New Database Table

#### Step 1: Create Schema File
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

#### Step 2: Register Schema
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

#### Step 3: Generate Migration
```bash
bun db:generate
```

### 3. Adding New Middleware

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

---

## Validation & Type Safety

### Zod Schema Usage:
```typescript
import { z } from "zod";

// Define schema
const mySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18),
});

// Use in route
.post(
  "/",
  requestValidator("json", mySchema),
  async (c) => {
    const data = c.req.valid("json"); // Type-safe!
    // data.name, data.email, data.age are all typed
  }
)
```

### Database Query Patterns:
```typescript
// Basic query
const users = await db.query.users.findMany({
  where: eq(users.isEnabled, true),
  limit: 10,
});

// With relations
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

// Complex query with Drizzle
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

---

## Logging & Debugging

### Logger Usage:
```typescript
import appLogger from "../utils/logger";

// In route handlers
appLogger.info("User created successfully", c);
appLogger.error("Failed to create user", c);
appLogger.debug("Debug information", c);
appLogger.sql("SELECT * FROM users", ["param1", "param2"]);

// Error logging (automatic in error handler)
appLogger.error(error, c);
```

### Log Files:
- `logs/YYYYMMDD-access.log` - HTTP requests
- `logs/YYYYMMDD-error.log` - Errors
- `logs/YYYYMMDD-info.log` - Info messages
- `logs/YYYYMMDD-debug.log` - Debug messages
- `logs/YYYYMMDD-sql.log` - SQL queries

---

## Testing

### Test Structure:
```typescript
// src/routes/auth/post-login.test.ts (kebab-case)
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import client from "../../utils/hono-test-client";  // kebab-case
import db from "../../drizzle";

describe("POST /auth/login", () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup test data
  });

  test("should login successfully", async () => {
    const response = await client.auth.login.$post({
      json: {
        username: "test",
        password: "password"
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
  });
});
```

### Testing Guidelines:
- **Use real Drizzle instance**: Do NOT mock the database - use actual Drizzle ORM with test database
- **Run tests with**: `bun run test` (not `bun test`)
- **Database setup**: Use real database connections for integration testing
- **Test data**: Create and cleanup test data in `beforeAll`/`afterAll` hooks
- **Assertions**: Test actual API responses and database state changes

### ⚠️ CRITICAL: Avoiding Test Interference in Bun

#### Bun's Global Mock Problem:
Bun's `mock.module()` creates **GLOBAL mocks** that persist across test files, causing widespread test interference. This can lead to:
- Previously passing tests suddenly failing
- Mocks from one test file affecting completely unrelated tests
- Unpredictable test behavior when running full test suite vs individual files

#### ❌ NEVER Use `mock.module()`:
```typescript
// ❌ DON'T DO THIS - Causes global interference
import { mock } from "bun:test";

// This will affect ALL test files globally
mock.module("../../utils/observability-utils", () => ({
  getClientIp: mock(() => "127.0.0.1")
}));
```

#### ✅ ALWAYS Use `spyOn()` Instead:
```typescript
// ✅ CORRECT - Use spyOn for isolated mocking
import { describe, test, expect, spyOn, afterEach } from "bun:test";
import * as observabilityUtils from "../../utils/observability-utils";

describe("My Test Suite", () => {
  afterEach(() => {
    // Clean up all spies after each test
    jest.restoreAllMocks?.() || vi?.restoreAllMocks?.();
  });

  test("should handle mocked function", () => {
    // Create isolated spy that only affects this test
    const getClientIpSpy = spyOn(observabilityUtils, "getClientIp")
      .mockReturnValue("192.168.1.1");
    
    // Test logic here...
    
    // Verify spy was called
    expect(getClientIpSpy).toHaveBeenCalledTimes(1);
  });
});
```

#### Environment Variable Testing:
For environment variable overrides, use `Object.defineProperty` instead of direct assignment:

```typescript
// ✅ CORRECT - Proper environment isolation
import appEnv from "../../appEnv";

describe("Environment Tests", () => {
  const originalValue = appEnv.SOME_SETTING;
  
  afterEach(() => {
    // Restore original value
    Object.defineProperty(appEnv, "SOME_SETTING", {
      value: originalValue,
      writable: true,
      configurable: true
    });
  });

  test("should work with modified environment", () => {
    // Override environment variable properly
    Object.defineProperty(appEnv, "SOME_SETTING", {
      value: "test-value",
      writable: true,
      configurable: true
    });
    
    // Test logic here...
  });
});
```

#### Service/Function Mocking Pattern:
```typescript
// ✅ CORRECT - Service mocking with spyOn
import { describe, test, expect, spyOn, afterEach } from "bun:test";
import * as observabilityService from "../../services/observability-service";

describe("Service Tests", () => {
  afterEach(() => {
    // Always restore mocks after each test
    jest.restoreAllMocks?.();
  });

  test("should handle service errors gracefully", async () => {
    // Mock service methods with spyOn
    const storeEventSpy = spyOn(observabilityService, "storeObservabilityEvent")
      .mockRejectedValue(new Error("Storage error"));
    
    const storeDetailsSpy = spyOn(observabilityService, "storeRequestDetails")
      .mockRejectedValue(new Error("Storage error"));
    
    // Test logic that should handle the errors gracefully...
    
    // Verify mocks were called
    expect(storeEventSpy).toHaveBeenCalled();
    expect(storeDetailsSpy).toHaveBeenCalled();
  });
});
```

#### Mock Cleanup Best Practices:
1. **Always restore mocks**: Use `afterEach()` to clean up spies
2. **Isolate test files**: Each test file should be independent
3. **Avoid global state**: Don't let one test affect another
4. **Use proper spy methods**: `.mockReturnValue()`, `.mockResolvedValue()`, `.mockRejectedValue()`
5. **Type casting when needed**: Use `// @ts-ignore` or proper type casting for complex mocks

#### Example of Proper Mock Restoration:
```typescript
import { describe, test, afterEach, spyOn } from "bun:test";

describe("Test Suite", () => {
  afterEach(() => {
    // Restore all mocks after each test
    if (typeof jest !== "undefined" && jest.restoreAllMocks) {
      jest.restoreAllMocks();
    }
    if (typeof vi !== "undefined" && vi.restoreAllMocks) {
      vi.restoreAllMocks();
    }
  });

  test("test with mocks", () => {
    const spy = spyOn(someModule, "someFunction").mockReturnValue("mocked");
    // Test logic...
    // Spy will be automatically restored in afterEach
  });
});
```

#### When You Must Mock Modules:
If you absolutely must mock entire modules (rare cases), use dynamic imports and local scope:

```typescript
test("should handle module mocking", async () => {
  // Create local mock within test scope
  const mockModule = {
    someFunction: () => "mocked result"
  };
  
  // Use dynamic import with local override
  const originalModule = await import("../../some-module");
  const moduleWithMock = { ...originalModule, ...mockModule };
  
  // Test with local mock...
  // Mock doesn't persist beyond this test
});
```

### Test Client:
```typescript
// src/utils/hono-test-client.ts (kebab-case)
import { testClient } from "hono/testing";
import { appRoutes } from "..";

const client = testClient(appRoutes);
export default client;
```

---

## Environment & Configuration

### Environment Variables:
```typescript
// Required environment variables
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
PRIVATE_KEY_PATH=private_key.pem
PUBLIC_KEY_PATH=public_key.pem

// Optional logging controls
LOG_ERROR=true
LOG_INFO=true
LOG_DEBUG=false
LOG_REQUEST=true
LOG_SQL=true
```

### App Settings:
Dynamic configuration stored in `app_settings` table:
```typescript
// Get setting
const value = await getAppSettingValue("SETTING_KEY");

// Set setting (through API)
POST /app-settings
{
  "key": "SETTING_KEY",
  "value": "SETTING_VALUE"
}
```

---

## API Documentation

### Standard Response Format:
```typescript
// Success response
{
  "data": [...],
  "_metadata": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1
  }
}

// Error response
{
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "formErrors": {
    "field": "Field-specific error"
  }
}
```

### Common Query Parameters:
```typescript
// Pagination
?page=1&limit=20

// Search
?q=search_term

// Sorting
?sort=[{"id":"createdAt","desc":true}]

// Filtering
?filter=[{"id":"status","value":"active"}]
```

---

## Security Considerations

### Authentication Security:
- JWT tokens with expiration
- Rate limiting on auth endpoints
- Password hashing with bcrypt
- OAuth integration for Google/Microsoft

### Authorization Security:
- Permission-based access control
- Route-level permission checking
- User role inheritance
- Soft delete for sensitive data

### Input Validation:
- Zod schema validation on all inputs
- SQL injection prevention via Drizzle ORM
- XSS protection via proper serialization
- CORS configuration

---

## Common Pitfalls & Best Practices

### ❌ Don't:
- Edit migration files directly
- Use `any` type - use `unknown` or specific types
- Skip permission checks on protected routes
- Hardcode sensitive values
- Use `||` for defaults (use `??` instead)
- Forget to add JSDoc comments
- Use camelCase for file names (use kebab-case)
- Group multiple endpoints in one file
- **Have multiple return statements in endpoints**
- **Return early for error cases (must throw instead)**
- Use `return` for error responses
- **❌ CRITICAL: NEVER use `mock.module()` in Bun tests - causes global interference**
- **❌ Use direct property assignment for environment variables in tests**
- **❌ Forget to restore mocks after tests - causes test interference**

### ✅ Do:
- Always use `authInfo` middleware before permission checks
- Validate all inputs with Zod schemas
- Use proper error handling with DashboardError
- Follow naming conventions strictly (kebab-case files)
- Add comprehensive logging
- Use TypeScript strictly
- Write tests for new features
- Create separate files for each endpoint
- Define complete paths in endpoint functions
- Use `createHonoRoute()` for endpoint creation
- **Have exactly ONE return statement per endpoint**
- **Throw errors for all validation and error cases**
- **Use throw instead of return for error responses**
- **✅ CRITICAL: Always use `spyOn()` instead of `mock.module()` in Bun tests**
- **✅ Use `Object.defineProperty()` for environment variable testing**
- **✅ Always restore mocks in `afterEach()` hooks to prevent test interference**

### Performance Tips:
- Use database indexes on frequently queried columns
- Implement proper pagination
- Use `with` clauses for efficient relation loading
- Cache frequently accessed data
- Monitor SQL query performance

---

## Quick Reference

### Essential Commands:
```bash
# Development
bun dev                 # Start development server
bun run test           # Run tests (use 'run' prefix for test command)
bun lint               # Run linter
bun format             # Format code

# Database
bun db:generate        # Generate migration
bun db:migrate         # Run migrations
bun db:seed            # Run seeders
bun db:studio          # Open Drizzle Studio
```

### File Generators:
```bash
# Generate new schema
turbo gen add-schema

# Generate new CRUD endpoints (creates multiple endpoint files)
turbo gen basic-crud
```

### Endpoint Examples:
```typescript
// CRUD endpoints for a resource would create:
// src/routes/products/
// ├── get-products.ts         # GET /products (list)
// ├── post-products.ts        # POST /products (create)  
// ├── get-product-by-id.ts    # GET /products/:id (read)
// ├── put-product-by-id.ts    # PUT /products/:id (update)
// └── delete-product-by-id.ts # DELETE /products/:id (delete)

// Each endpoint follows single return rule:
const deleteProductEndpoint = createHonoRoute()
  .delete("/products/:id", checkPermission("products.delete"), async (c) => {
    const productId = c.req.param("id");
    
    // Validate ID - THROW on error
    if (!productId) {
      throw badRequest({ message: "Product ID is required" });
    }
    
    // Check if exists - THROW if not found
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId)
    });
    if (!product) {
      throw notFound({ message: "Product not found" });
    }
    
    // Check permissions - THROW if unauthorized
    if (product.ownerId !== c.var.uid && !c.var.currentUser?.permissions.includes("products.deleteAny")) {
      throw forbidden({ message: "Cannot delete this product" });
    }
    
    // Soft delete the product
    await db.update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, productId));
    
    // ONLY ONE RETURN
    return c.json({ message: "Product deleted successfully" });
  });
```

---

## Troubleshooting

### Common Issues:

1. **Database Connection Issues**
   - Check `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Permission Errors**
   - Check if user has required permissions
   - Verify permission is defined in database
   - Ensure `authInfo` middleware is used

3. **Type Errors**
   - Ensure schemas are properly imported in `drizzle/index.ts`
   - Check TypeScript configuration
   - Verify Zod schema definitions

4. **Migration Issues**
   - Never edit migration files directly
   - Use `bun db:generate` to create new migrations
   - Check schema definitions for errors

5. **🚨 Test Interference Issues (Bun-specific)**
   - **Symptom**: Previously passing tests suddenly fail when running full test suite
   - **Symptom**: Tests pass individually but fail when run together
   - **Symptom**: Mocks from one test file affecting other test files
   - **Root Cause**: Using `mock.module()` creates global mocks in Bun
   - **Solution**: Replace all `mock.module()` usage with `spyOn()`
   - **Prevention**: Always restore mocks in `afterEach()` hooks

6. **Environment Variable Issues in Tests**
   - **Symptom**: Environment overrides not working in tests
   - **Symptom**: Tests affecting each other's environment state
   - **Root Cause**: Direct property assignment doesn't work reliably
   - **Solution**: Use `Object.defineProperty()` for environment overrides
   - **Prevention**: Restore original values in `afterEach()` or `afterAll()`

### Test Debugging Checklist:
When tests are failing unexpectedly:

1. **Check for global mocks**:
   ```bash
   # Search for problematic mock.module usage
   grep -r "mock.module" src/
   ```

2. **Run tests individually vs together**:
   ```bash
   # Run single test file
   bun test src/specific-test.test.ts
   
   # Run full suite
   bun test
   
   # If individual passes but full suite fails = test interference
   ```

3. **Look for missing mock cleanup**:
   ```typescript
   // Every test file should have this pattern
   afterEach(() => {
     jest.restoreAllMocks?.();
   });
   ```

4. **Check environment variable handling**:
   ```typescript
   // ❌ Wrong - doesn't work reliably
   appEnv.SOME_VAR = "test-value";
   
   // ✅ Correct - proper override
   Object.defineProperty(appEnv, "SOME_VAR", {
     value: "test-value",
     writable: true,
     configurable: true
   });
   ```

5. **Verify test isolation**:
   - Each test should be able to run independently
   - Tests should not depend on execution order
   - Database state should be properly cleaned up

---

## Summary

This backend follows a strict, well-organized architecture with:
- **Type-safe development** with TypeScript and Zod
- **Secure authentication** with JWT and RBAC
- **Scalable database design** with Drizzle ORM
- **Comprehensive logging** and error handling
- **Modular routing** with middleware-based architecture
- **Thorough testing** capabilities

When working with this codebase, always:
1. Read the Drizzle README for database work
2. Follow existing patterns and conventions (kebab-case files, individual endpoints)
3. Use proper error handling and validation
4. Add comprehensive logging and tests
5. Maintain type safety throughout
6. Define complete paths within endpoint functions
7. Create separate files for each endpoint using descriptive kebab-case names
8. **CRITICAL**: Ensure every endpoint has exactly ONE return statement
9. **CRITICAL**: Use throw for all error cases, never return early

For specific implementation details, refer to existing code examples in the respective directories and follow the established patterns.

---

## Endpoint Architecture Pattern

### One Endpoint Per File
This codebase follows a **one endpoint per file** architecture where:

- Each HTTP endpoint is defined in its own file
- The complete path (e.g., `/users`, `/users/:id`) is defined within the endpoint function
- File names use kebab-case and describe the endpoint: `{method}-{resource}-{action?}.ts`
- All endpoints are registered in the main `index.ts` file

### Benefits:
- **Clear separation of concerns** - Each file has a single responsibility
- **Easy to locate and modify** specific endpoints
- **Better testability** - Each endpoint can be tested in isolation
- **Improved maintainability** - Changes to one endpoint don't affect others
- **Consistent naming** - File names clearly indicate their purpose

### Endpoint Registration Pattern:
```typescript
// src/index.ts
import getUsersEndpoint from "./routes/users/get-users";
import postUsersEndpoint from "./routes/users/post-users";
import getUserByIdEndpoint from "./routes/users/get-user-by-id";

export const appRoutes = app
  .use(requestLogger)
  .use(cors({ origin: "*" }))
  .use(authTokenMiddleware)
  // Register each endpoint individually
  .route("/", getUsersEndpoint)
  .route("/", postUsersEndpoint)
  .route("/", getUserByIdEndpoint)
  // ... other endpoints
  .get("/test", (c) => c.json({ message: "Server is up" }));
```

---

## Critical Endpoint Rules

### Single Return Statement Rule
⚠️ **MANDATORY**: Every endpoint function MUST have exactly **ONE RETURN STATEMENT** at the end.

#### ❌ WRONG - Multiple returns:
```typescript
const getUserEndpoint = createHonoRoute()
  .get("/users/:id", async (c) => {
    const userId = c.req.param("id");
    
    if (!userId) {
      return c.json({ error: "ID required" }, 400);  // ❌ Early return
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return c.json({ error: "Not found" }, 404);    // ❌ Early return
    }
    
    return c.json(user);  // ❌ Multiple returns in same function
  });
```

#### ✅ CORRECT - Single return with throws:
```typescript
const getUserEndpoint = createHonoRoute()
  .get("/users/:id", async (c) => {
    const userId = c.req.param("id");
    
    // Validate - THROW on error
    if (!userId) {
      throw badRequest({ message: "User ID is required" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    // Handle not found - THROW
    if (!user) {
      throw notFound({ message: "User not found" });
    }
    
    // Additional business logic with throws...
    if (user.isBlocked) {
      throw forbidden({ message: "User is blocked" });
    }
    
    // ONLY ONE RETURN - at the very end
    return c.json(user);
  });
```

### Why This Rule Exists:
1. **Predictable flow** - Always one exit point
2. **Easier debugging** - No confusion about where responses come from
3. **Consistent error handling** - All errors go through the same mechanism
4. **Better testing** - Single return path to verify
5. **Middleware compatibility** - Ensures proper middleware execution

### Error Throwing Patterns:
```typescript
// Input validation
if (!email || !isValidEmail(email)) {
  throw badRequest({ 
    message: "Invalid email",
    formErrors: { email: "Email is required and must be valid" }
  });
}

// Permission checks
if (!user.canAccess(resource)) {
  throw forbidden({ message: "Access denied" });
}

// Not found cases
if (!record) {
  throw notFound({ message: "Record not found" });
}

// Business rule violations
if (user.age < minimumAge) {
  throw badRequest({ 
    message: "Age requirement not met",
    formErrors: { age: `Minimum age is ${minimumAge}` }
  });
}

// Rate limiting or quota checks
if (userRequests > maxRequests) {
  throw new DashboardError({
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests",
    statusCode: 429,
    severity: "MEDIUM"
  });
}
```

---
