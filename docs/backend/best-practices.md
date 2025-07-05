# Best Practices

This document outlines coding standards, conventions, and best practices for the backend codebase.

## File Naming Conventions

### General Rules
- **Kebab-case** for all file names
- **Lowercase** file extensions
- **Descriptive** names that indicate purpose

### Endpoint Files
- Format: `{method}-{resource}-{action?}.ts`
- Examples:
  - `get-users.ts` - GET /users
  - `post-users.ts` - POST /users
  - `get-user-by-id.ts` - GET /users/:id
  - `put-user-by-id.ts` - PUT /users/:id
  - `delete-user-by-id.ts` - DELETE /users/:id

### Schema Files
- Format: `{resource-name}.ts`
- Examples:
  - `users.ts` - User table schema
  - `roles.ts` - Role table schema
  - `oauth-google.ts` - Google OAuth schema

### Test Files
- Format: `{original-name}.test.ts`
- Examples:
  - `get-users.test.ts` - Tests for GET /users endpoint
  - `auth-utils.test.ts` - Tests for auth utilities

## Coding Standards

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

## Code Structure

### Endpoint Architecture
```typescript
// ✅ CORRECT - Single return with throws
const goodEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/resource/:id", checkPermission("resource.read"), async (c) => {
    const id = c.req.param("id");
    
    // Validate input - THROW on error
    if (!id) {
      throw badRequest({ message: "ID is required" });
    }
    
    // Business logic
    const resource = await db.query.resource.findFirst({
      where: eq(resource.id, id)
    });
    
    // Check result - THROW on error
    if (!resource) {
      throw notFound({ message: "Resource not found" });
    }
    
    // SINGLE RETURN at the end
    return c.json({ data: resource });
  });
```

### Error Handling
```typescript
// ✅ CORRECT - Throw custom errors
import { badRequest, notFound, forbidden } from "../errors/DashboardError";

// Validation error
if (!isValidInput(data)) {
  throw badRequest({ 
    message: "Invalid input",
    formErrors: { field: "Field is required" }
  });
}

// Resource not found
if (!resource) {
  throw notFound({ message: "Resource not found" });
}

// Permission error
if (!hasPermission(user, "action")) {
  throw forbidden({ message: "Insufficient permissions" });
}
```

### Database Operations
```typescript
// ✅ Use proper Drizzle patterns
const createUser = async (userData: CreateUserType) => {
  // Check for conflicts
  const existing = await db.query.users.findFirst({
    where: eq(users.email, userData.email)
  });
  
  if (existing) {
    throw badRequest({ 
      message: "User already exists",
      formErrors: { email: "Email is already taken" }
    });
  }
  
  // Create with transaction if needed
  const [user] = await db.insert(users).values(userData).returning();
  return user;
};
```

## TypeScript Best Practices

### Type Definitions
```typescript
// ✅ Use proper type definitions
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  isEnabled?: boolean;
}

// ✅ Infer types from schemas
export type User = typeof usersSchema.$inferSelect;
export type NewUser = typeof usersSchema.$inferInsert;
```

### Generic Functions
```typescript
// ✅ Use generics for reusable functions
const findById = async <T>(
  table: any,
  id: string
): Promise<T | null> => {
  return await db.query[table].findFirst({
    where: eq(table.id, id)
  });
};
```

### Type Guards
```typescript
// ✅ Use type guards for runtime validation
function isValidUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj
  );
}
```

## Testing Best Practices

### Test Structure
```typescript
// ✅ Proper test organization
describe("GET /users", () => {
  let testUser: Awaited<ReturnType<typeof createUserForTesting>>;

  beforeAll(async () => {
    testUser = await createUserForTesting({
      permissions: ["users.read"]
    });
  });

  afterAll(async () => {
    await cleanupTestUser(testUser.user.id);
  });

  test("should return users list", async () => {
    const response = await client.users.$get({
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Mock Management
```typescript
// ✅ Proper mock cleanup
import { describe, test, expect, spyOn, afterEach } from "bun:test";

describe("Service Tests", () => {
  afterEach(() => {
    jest.restoreAllMocks?.();
    vi?.restoreAllMocks?.();
  });

  test("should handle service errors", () => {
    const spy = spyOn(service, "method").mockRejectedValue(new Error());
    // Test logic
  });
});
```

## Database Best Practices

### Schema Design
```typescript
// ✅ Proper schema definition
export const usersSchema = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(usersSchema, ({ many }) => ({
  rolesToUsers: many(rolesToUsersSchema),
}));
```

### Query Patterns
```typescript
// ✅ Efficient query with relations
const getUserWithRoles = async (userId: string) => {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      rolesToUsers: {
        with: {
          role: true
        }
      }
    }
  });
};

// ✅ Paginated queries
const getUsersPaginated = async (page: number, limit: number) => {
  return await db.query.users.findMany({
    limit,
    offset: (page - 1) * limit,
    orderBy: desc(users.createdAt)
  });
};
```

## Security Best Practices

### Input Validation
```typescript
// ✅ Comprehensive validation
const userCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
});
```

### Permission Checks
```typescript
// ✅ Always check permissions
const protectedEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/protected", checkPermission("resource.read"), async (c) => {
    // Route logic
  });
```

### Data Sanitization
```typescript
// ✅ Sanitize user data
const sanitizeUser = (user: User) => {
  const { password, ...safeUser } = user;
  return safeUser;
};
```

## Performance Best Practices

### Database Performance
- Use database indexes on frequently queried columns
- Implement proper pagination
- Use `with` clauses for efficient relation loading
- Cache frequently accessed data
- Monitor SQL query performance

### Caching Strategies
```typescript
// ✅ Simple in-memory cache
const cache = new Map<string, any>();

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  
  // Expire after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return data;
};
```

### Query Optimization
```typescript
// ✅ Efficient batch operations
const createMultipleUsers = async (users: NewUser[]) => {
  return await db.insert(usersSchema).values(users).returning();
};

// ✅ Use appropriate data types
const getUserStats = async () => {
  return await db
    .select({
      totalUsers: count(users.id),
      activeUsers: count(users.id).where(eq(users.isEnabled, true))
    })
    .from(users);
};
```

## Logging Best Practices

### Structured Logging
```typescript
// ✅ Informative logging
appLogger.info("User operation started", c);
appLogger.info(`Processing ${items.length} items`, c);
appLogger.info("Operation completed successfully", c);

// ✅ Error context
try {
  await operation();
} catch (error) {
  appLogger.error("Operation failed", c);
  appLogger.error(`Error details: ${error.message}`, c);
  throw error;
}
```

### Security Logging
```typescript
// ✅ Log security events
appLogger.info(`Login attempt: ${email}`, c);
appLogger.info(`Permission check: ${permission} for user ${userId}`, c);

// ❌ Never log sensitive data
// appLogger.info(`Password: ${password}`, c); // NEVER!
```

## API Design Best Practices

### RESTful Conventions
```typescript
// ✅ Follow REST conventions
GET    /users           // List users
POST   /users           // Create user
GET    /users/:id       // Get specific user
PUT    /users/:id       // Update user
DELETE /users/:id       // Delete user
```

### Response Consistency
```typescript
// ✅ Consistent response format
return c.json({
  data: result,
  _metadata: {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  }
});
```

## Documentation Best Practices

### JSDoc Comments
```typescript
/**
 * Creates a new user with the provided data
 * @param userData - The user data to create
 * @returns Promise<User> - The created user
 * @throws BadRequestError - If user already exists
 */
const createUser = async (userData: CreateUserType): Promise<User> => {
  // Implementation
};
```

### Code Comments
```typescript
// ✅ Explain business logic
// Check if user has exceeded the maximum allowed posts per day
const dailyPostCount = await getDailyPostCount(userId);
if (dailyPostCount >= MAX_DAILY_POSTS) {
  throw badRequest({ message: "Daily post limit exceeded" });
}
```

## Deployment Best Practices

### Environment Configuration
- Use environment-specific configuration files
- Validate required environment variables at startup
- Never commit secrets to version control
- Use secrets management systems

### Error Handling
- Implement global error handlers
- Log errors with appropriate detail levels
- Return user-friendly error messages
- Monitor error rates and patterns

### Monitoring
- Implement health checks
- Monitor application performance
- Set up alerting for critical issues
- Track business metrics

## Related Documentation

- [Route Development](routes.md) - Endpoint patterns
- [Database Layer](database.md) - Database best practices
- [Testing](testing.md) - Testing best practices
- [Security](security.md) - Security best practices
