# Validation & Type Safety

This document covers validation patterns and type safety implementation in the backend.

## Zod Schema Usage

### Basic Schema Definition
```typescript
import { z } from "zod";

// Define schema
const mySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(18, "Must be at least 18 years old"),
});

// Type inference
type MySchemaType = z.infer<typeof mySchema>;
```

### Using Schema in Routes
```typescript
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

### Advanced Schema Patterns

#### Optional Fields
```typescript
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18).optional(),
  bio: z.string().optional(),
});
```

#### Nested Objects
```typescript
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(5),
});

const userWithAddressSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  address: addressSchema,
});
```

#### Arrays
```typescript
const userWithTagsSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  tags: z.array(z.string()),
  roles: z.array(z.enum(["admin", "user", "editor"])),
});
```

#### Transformations
```typescript
const userSchema = z.object({
  name: z.string().min(1).transform(val => val.trim()),
  email: z.string().email().transform(val => val.toLowerCase()),
  age: z.string().transform(val => parseInt(val, 10)),
});
```

### Common Validation Patterns

#### Pagination Schema
```typescript
export const paginationRequestSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
```

#### User Form Schema
```typescript
export const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isEnabled: z.boolean().default(true),
});
```

#### Update Schema (Partial)
```typescript
export const userUpdateSchema = userFormSchema.partial().omit({ password: true });
```

## Request Validation

### JSON Body Validation
```typescript
const createUserEndpoint = createHonoRoute()
  .post(
    "/users",
    requestValidator("json", userFormSchema),
    async (c) => {
      const userData = c.req.valid("json");
      // userData is fully typed
    }
  );
```

### Query Parameter Validation
```typescript
const getUsersEndpoint = createHonoRoute()
  .get(
    "/users",
    requestValidator("query", paginationRequestSchema),
    async (c) => {
      const { page, limit } = c.req.valid("query");
      // page and limit are typed as numbers
    }
  );
```

### Form Data Validation
```typescript
const uploadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const uploadEndpoint = createHonoRoute()
  .post(
    "/upload",
    requestValidator("form", uploadSchema),
    async (c) => {
      const { title, description } = c.req.valid("form");
      // Handle file upload
    }
  );
```

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

### Typed Query Results
```typescript
// Using select to get specific fields
const usersWithRoles = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
    roleName: roles.name,
  })
  .from(users)
  .leftJoin(rolesToUsers, eq(users.id, rolesToUsers.userId))
  .leftJoin(roles, eq(rolesToUsers.roleId, roles.id));

// Type is automatically inferred
type UserWithRole = typeof usersWithRoles[0];
```

## Error Validation

### Custom Validation Errors
```typescript
const customUserSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
```

### Handling Validation Errors
```typescript
const createUserEndpoint = createHonoRoute()
  .post(
    "/users",
    requestValidator("json", userFormSchema),
    async (c) => {
      const userData = c.req.valid("json");
      
      // Additional business logic validation
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email)
      });
      
      if (existingUser) {
        throw badRequest({
          message: "User already exists",
          formErrors: {
            email: "This email is already registered"
          }
        });
      }
      
      // Continue with creation
      return c.json({ data: newUser }, 201);
    }
  );
```

## TypeScript Integration

### HonoEnv Type Safety
```typescript
type HonoEnv = {
  Variables: {
    uid?: string;
    currentUser?: {
      id: string;
      name: string;
      permissions: PermissionCode[];
      roles: RoleCode[];
    };
    requestId: string;
  };
};
```

### Typed Database Schemas
```typescript
// Schema definition with TypeScript types
export const usersSchema = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inferred types
export type User = typeof usersSchema.$inferSelect;
export type NewUser = typeof usersSchema.$inferInsert;
```

### Type Guards
```typescript
function isValidUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'name' in user &&
    'email' in user
  );
}
```

## Best Practices

### Schema Organization
- Keep schemas in the `@repo/validation` package
- Use descriptive names for schemas
- Create separate schemas for create/update operations
- Use transformations for data cleaning

### Validation Placement
- Validate at the API boundary (request validation)
- Validate business rules in route handlers
- Use database constraints for data integrity
- Validate external API responses

### Error Handling
- Provide clear, user-friendly error messages
- Use `formErrors` for field-specific validation errors
- Validate early and fail fast
- Log validation errors for debugging

### Performance
- Use efficient query patterns
- Avoid N+1 queries with proper relations
- Use database indexes for frequently queried fields
- Consider pagination for large datasets

## Related Documentation

- [Route Development](routes.md) - Using validation in endpoints
- [Database Layer](database.md) - Database schema and types
- [Best Practices](best-practices.md) - Coding standards and conventions
- [Testing](testing.md) - Testing validation logic
