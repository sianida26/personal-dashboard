# Route Development Patterns

This document covers the patterns and conventions for creating API endpoints in the backend.

## Standard Endpoint Structure

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

## Endpoint File Naming Convention

- Use **kebab-case** for all file names
- Format: `{method}-{resource}-{action?}.ts`
- Examples:
  - `get-users.ts` - GET /users
  - `post-users.ts` - POST /users  
  - `get-user-by-id.ts` - GET /users/:id
  - `put-user-by-id.ts` - PUT /users/:id
  - `delete-user-by-id.ts` - DELETE /users/:id

## Request Validation Pattern

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

## Error Handling Pattern

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

## Custom Error Examples

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

## Single Return Statement Rule

### Why This Rule Exists
1. **Consistency** - Predictable code structure
2. **Maintainability** - Easier to debug and modify
3. **Error Handling** - Clear separation between success and error cases
4. **Type Safety** - Better TypeScript inference

### ❌ WRONG - Multiple returns
```typescript
const badEndpoint = createHonoRoute()
  .get("/users/:id", async (c) => {
    const userId = c.req.param("id");
    
    // DON'T DO THIS - multiple returns
    if (!userId) {
      return c.json({ error: "ID required" }, 400);
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    return c.json(user);
  });
```

### ✅ CORRECT - Single return with throws
```typescript
const goodEndpoint = createHonoRoute()
  .get("/users/:id", async (c) => {
    const userId = c.req.param("id");
    
    // Throw for validation errors
    if (!userId) {
      throw badRequest({ message: "ID required" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    // Throw for not found
    if (!user) {
      throw notFound({ message: "User not found" });
    }
    
    // Single return at the end
    return c.json(user);
  });
```

## Endpoint Organization

### File Structure
```
src/routes/users/
├── get-users.ts          # GET /users
├── post-users.ts         # POST /users
├── get-user-by-id.ts     # GET /users/:id
├── put-user-by-id.ts     # PUT /users/:id
├── delete-user-by-id.ts  # DELETE /users/:id
└── get-user-reviews.ts   # GET /users/:id/reviews
```

### Registration Pattern
```typescript
// src/index.ts
import getUsersEndpoint from "./routes/users/get-users";
import postUsersEndpoint from "./routes/users/post-users";
import getUserByIdEndpoint from "./routes/users/get-user-by-id";

const appRoutes = app
  .use(requestLogger)
  .use(cors({ origin: "*" }))
  .use(rateLimiter({ /* ... */ }))
  .use(authTokenMiddleware)
  // Register individual endpoints
  .route("/", getUsersEndpoint)
  .route("/", postUsersEndpoint)
  .route("/", getUserByIdEndpoint)
  // ... other endpoints
  .get("/test", (c) => c.json({ message: "Server is up" }));
```

## Common Patterns

### CRUD Operations
```typescript
// CREATE - POST /users
const createUserEndpoint = createHonoRoute()
  .use(authInfo)
  .post("/users", requestValidator("json", userFormSchema), async (c) => {
    const userData = c.req.valid("json");
    // ... validation and creation logic
    return c.json({ data: newUser }, 201);
  });

// READ - GET /users
const getUsersEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/users", requestValidator("query", paginationRequestSchema), async (c) => {
    const { page, limit } = c.req.valid("query");
    // ... fetch logic
    return c.json({ data: users, _metadata: { totalItems, totalPages, currentPage } });
  });

// UPDATE - PUT /users/:id
const updateUserEndpoint = createHonoRoute()
  .use(authInfo)
  .put("/users/:id", requestValidator("json", userUpdateSchema), async (c) => {
    const userId = c.req.param("id");
    const updateData = c.req.valid("json");
    // ... validation and update logic
    return c.json({ data: updatedUser });
  });

// DELETE - DELETE /users/:id
const deleteUserEndpoint = createHonoRoute()
  .use(authInfo)
  .delete("/users/:id", async (c) => {
    const userId = c.req.param("id");
    // ... validation and deletion logic
    return c.json({ message: "User deleted successfully" });
  });
```

### Nested Resources
```typescript
// GET /users/:id/posts
const getUserPostsEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/users/:id/posts", async (c) => {
    const userId = c.req.param("id");
    // ... fetch user posts
    return c.json({ data: posts });
  });
```

## Related Documentation

- [Authentication & Authorization](auth.md) - Middleware and permission patterns
- [Validation & Type Safety](validation.md) - Request validation patterns
- [Common Development Tasks](development-tasks.md#1-adding-a-new-endpoint) - Creating new endpoints
- [Best Practices](best-practices.md) - Coding standards and conventions
