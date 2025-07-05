# Testing

This document covers testing patterns, utilities, and best practices for the backend.

## Test Structure

### Basic Test Setup
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

## Test User Utilities

The codebase provides utilities for creating and managing test users with specific roles and permissions:

### Creating Test Users

```typescript
// src/utils/test-utils/create-user-for-testing.ts
import { createUserForTesting, cleanupTestUser } from "../../utils/test-utils/create-user-for-testing";

// Create a basic test user
const { user, accessToken } = await createUserForTesting();

// Create user with specific roles
const adminUser = await createUserForTesting({
  name: "Test Admin",
  username: "test-admin",
  roles: ["super-admin"]
});

// Create user with specific permissions
const limitedUser = await createUserForTesting({
  name: "Limited User",
  username: "limited-user",
  permissions: ["users.read", "roles.read"]
});

// Create user with custom details
const customUser = await createUserForTesting({
  name: "Custom User",
  username: "custom-user",
  email: "custom@example.com",
  password: "customPassword123!",
  isEnabled: true,
  roles: ["editor"],
  permissions: ["posts.create", "posts.update"]
});
```

### Test User Data Structure

```typescript
interface TestUserData {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Additional computed properties
    permissions: PermissionCode[];  // All permissions (from roles + direct)
    roles: string[];               // Role names assigned to user
  };
  accessToken: string;  // JWT token for API authentication
}
```

### Cleanup Test Users

```typescript
// Cleanup by user ID
await cleanupTestUser(user.id);

// Cleanup by username (convenience method)
await cleanupTestUserByUsername("test-admin");
```

## Complete Test Example

```typescript
// src/routes/users/get-users.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createUserForTesting, cleanupTestUser } from "../../utils/test-utils/create-user-for-testing";
import client from "../../utils/hono-test-client";

describe("GET /users", () => {
  let adminUser: Awaited<ReturnType<typeof createUserForTesting>>;
  let regularUser: Awaited<ReturnType<typeof createUserForTesting>>;

  beforeAll(async () => {
    // Create test users with different permission levels
    adminUser = await createUserForTesting({
      name: "Admin User",
      username: "admin-test",
      roles: ["super-admin"]
    });

    regularUser = await createUserForTesting({
      name: "Regular User", 
      username: "regular-test",
      permissions: ["users.read"]
    });
  });

  afterAll(async () => {
    // Cleanup test users
    await cleanupTestUser(adminUser.user.id);
    await cleanupTestUser(regularUser.user.id);
  });

  test("should allow admin to get all users", async () => {
    const response = await client.users.$get({
      headers: {
        Authorization: `Bearer ${adminUser.accessToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
  });

  test("should allow user with read permission to get users", async () => {
    const response = await client.users.$get({
      headers: {
        Authorization: `Bearer ${regularUser.accessToken}`
      }
    });

    expect(response.status).toBe(200);
  });

  test("should deny access without proper permissions", async () => {
    // Create user without permissions
    const limitedUser = await createUserForTesting({
      name: "Limited User",
      username: "limited-test",
      permissions: [] // No permissions
    });

    const response = await client.users.$get({
      headers: {
        Authorization: `Bearer ${limitedUser.accessToken}`
      }
    });

    expect(response.status).toBe(403);
    
    // Cleanup
    await cleanupTestUser(limitedUser.user.id);
  });
});
```

## Testing Guidelines

- **Use real Drizzle instance**: Do NOT mock the database - use actual Drizzle ORM with test database
- **Run tests with**: `bun run test` (not `bun test`)
- **Database setup**: Use real database connections for integration testing
- **Test data**: Use `createUserForTesting()` and `cleanupTestUser()` for user management
- **Assertions**: Test actual API responses and database state changes
- **Permission testing**: Create users with specific roles/permissions to test authorization

## ⚠️ CRITICAL: Avoiding Test Interference in Bun

### Bun's Global Mock Problem
Bun's `mock.module()` creates **GLOBAL mocks** that persist across test files, causing widespread test interference. This can lead to:
- Previously passing tests suddenly failing
- Mocks from one test file affecting completely unrelated tests
- Unpredictable test behavior when running full test suite vs individual files

### ❌ NEVER Use `mock.module()`

```typescript
// ❌ DON'T DO THIS - Causes global interference
import { mock } from "bun:test";

// This will affect ALL test files globally
mock.module("../../utils/observability-utils", () => ({
  getClientIp: mock(() => "127.0.0.1")
}));
```

### ✅ ALWAYS Use `spyOn()` Instead

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

## Environment Variable Testing

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

## Service/Function Mocking Pattern

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

## Mock Cleanup Best Practices

1. **Always restore mocks**: Use `afterEach()` to clean up spies
2. **Isolate test files**: Each test file should be independent
3. **Avoid global state**: Don't let one test affect another
4. **Use proper spy methods**: `.mockReturnValue()`, `.mockResolvedValue()`, `.mockRejectedValue()`
5. **Type casting when needed**: Use `// @ts-ignore` or proper type casting for complex mocks

## Example of Proper Mock Restoration

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

## When You Must Mock Modules

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

## Test Client

```typescript
// src/utils/hono-test-client.ts (kebab-case)
import { testClient } from "hono/testing";
import { appRoutes } from "..";

const client = testClient(appRoutes);
export default client;
```

## Test Debugging Checklist

When tests are failing unexpectedly:

1. **Check for global mocks**: Look for `mock.module()` calls
2. **Run tests individually vs together**: Compare behavior
3. **Look for missing mock cleanup**: Ensure `afterEach()` restores mocks
4. **Check environment variables**: Verify proper restoration
5. **Review test isolation**: Ensure tests don't depend on each other

## Common Test Patterns

### Testing CRUD Operations
```typescript
describe("User CRUD Operations", () => {
  test("should create user", async () => {
    const response = await client.users.$post({
      json: {
        name: "Test User",
        email: "test@example.com",
        password: "password123"
      }
    });
    
    expect(response.status).toBe(201);
  });

  test("should get user by ID", async () => {
    const user = await createUserForTesting();
    
    const response = await client.users[":id"].$get({
      param: { id: user.user.id }
    });
    
    expect(response.status).toBe(200);
  });
});
```

### Testing Authorization
```typescript
describe("Authorization Tests", () => {
  test("should deny access without token", async () => {
    const response = await client.users.$get();
    expect(response.status).toBe(401);
  });

  test("should deny access with insufficient permissions", async () => {
    const user = await createUserForTesting({
      permissions: [] // No permissions
    });
    
    const response = await client.users.$get({
      headers: {
        Authorization: `Bearer ${user.accessToken}`
      }
    });
    
    expect(response.status).toBe(403);
  });
});
```

## Related Documentation

- [Common Development Tasks](development-tasks.md#9-adding-new-test) - Creating new tests
- [Best Practices](best-practices.md) - Testing best practices
- [Troubleshooting](troubleshooting.md#test-debugging-checklist) - Debugging test issues
