# Authentication & Authorization

This document covers the authentication and authorization system implementation.

## Authentication Flow

The authentication system follows this flow:
1. **JWT Tokens**: Stored in `Authorization: Bearer <token>` header
2. **Token Validation**: `authTokenMiddleware` extracts and validates JWT
3. **User Loading**: `authInfo` middleware loads user data, roles, permissions
4. **Permission Checking**: `checkPermission()` or `protect()` middleware

### Token Lifetimes & Rotation
- **Access Tokens** expire after **5 minutes** and embed the user id, permissions, and roles. They are meant to be stored in memory and attached to every protected request.
- **Refresh Tokens** expire after **60 days**. They are persisted as hashed rows inside the `refresh_tokens` table so they can be revoked per device.
- Every call to `POST /auth/refresh` both issues a brand new access token and rotates the refresh token (the previous one is revoked immediately).
- `POST /auth/logout` now requires the refresh token in the request body and revokes it server-side before clearing the session client-side.

All authentication responses now include both tokens plus their respective `accessTokenExpiresIn` and `refreshTokenExpiresIn` values so clients can schedule proactive refreshes (the frontend refreshes at the 4-minute mark by default).

## Middleware Stack

### 1. authTokenMiddleware
- Extracts JWT token from Authorization header
- Validates token signature and expiration
- Sets user ID in context (`c.var.uid`)

### 2. authInfo
- Loads user data from database using user ID
- Loads user roles and permissions
- Sets current user in context (`c.var.currentUser`)

### 3. checkPermission / protect
- Checks if user has required permissions
- Throws unauthorized error if permission denied
- Allows request to proceed if authorized

## Permission System

### Single Permission Check
```typescript
// Check single permission
checkPermission("users.read")
```

### Multiple Permission Check
```typescript
// Check multiple permissions (user must have at least one)
protect(["users.read", "users.write"])
```

### Available Permission Patterns
- `resource.read` / `resource.readAll` - Read access
- `resource.write` / `resource.create` / `resource.update` - Write access
- `resource.delete` - Delete access
- `all` - Super admin access (special permission)

## HonoEnv Variables

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

## Authentication Middleware Usage

### Basic Protected Route
```typescript
const getUsersEndpoint = createHonoRoute()
  .use(authInfo)  // Load user authentication info
  .get(
    "/users",
    checkPermission("users.read"),  // Check permissions
    async (c) => {
      // Route logic here
      return c.json({ data: users });
    }
  );
```

### Multiple Permission Check
```typescript
const getUsersEndpoint = createHonoRoute()
  .use(authInfo)
  .get(
    "/users",
    protect(["users.read", "users.readAll"]),  // User needs either permission
    async (c) => {
      // Route logic here
      return c.json({ data: users });
    }
  );
```

### Public Route (No Authentication)
```typescript
const getPublicDataEndpoint = createHonoRoute()
  .get(
    "/public/data",
    // No auth middleware needed
    async (c) => {
      // Route logic here
      return c.json({ data: publicData });
    }
  );
```

## Role-Based Access Control (RBAC)

### Role Structure
- **Super Admin**: Has `all` permission (access to everything)
- **Admin**: Has most permissions except super admin functions
- **Editor**: Has read/write permissions for content
- **User**: Has basic read permissions

### Permission Inheritance
- Users can have **direct permissions** assigned
- Users can have **role-based permissions** through roles
- Final permissions are the union of direct + role-based permissions

### Example Role Definition
```typescript
// Default roles structure
const defaultRoles = [
  {
    code: "super-admin",
    name: "Super Admin",
    permissions: ["all"]
  },
  {
    code: "admin",
    name: "Administrator",
    permissions: [
      "users.read", "users.write", "users.delete",
      "roles.read", "roles.write",
      "permissions.read"
    ]
  },
  {
    code: "editor",
    name: "Editor",
    permissions: [
      "users.read",
      "posts.read", "posts.write", "posts.delete"
    ]
  },
  {
    code: "user",
    name: "User",
    permissions: [
      "posts.read"
    ]
  }
];
```

## JWT Token Structure

### Token Contents
```typescript
interface JWTPayload {
  uid: string;          // User ID
  iat: number;          // Issued at timestamp
  exp: number;          // Expiration timestamp
  // Additional claims as needed
}
```

### Token Generation
```typescript
// Generate access token
const accessToken = jwt.sign(
  { uid: user.id },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);
```

### Token Validation
```typescript
// Validate token
const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

## Authentication Endpoints

### Login
```typescript
// POST /auth/login
const loginEndpoint = createHonoRoute()
  .post(
    "/auth/login",
    requestValidator("json", loginSchema),
    async (c) => {
      const { username, password } = c.req.valid("json");
      
      // Validate credentials
      const user = await validateCredentials(username, password);
      if (!user) {
        throw unauthorized({ message: "Invalid credentials" });
      }
      
      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      
      return c.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  );
```

### Get Current User
```typescript
// GET /auth/me
const getMeEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/auth/me", async (c) => {
    const currentUser = c.var.currentUser;
    
    if (!currentUser) {
      throw unauthorized({ message: "Not authenticated" });
    }
    
    return c.json({
      data: currentUser
    });
  });
```

### Logout
```typescript
// POST /auth/logout
const logoutEndpoint = createHonoRoute()
  .use(authInfo)
  .post("/auth/logout", async (c) => {
    // Token invalidation logic here
    // (e.g., add to blacklist, clear refresh token)
    
    return c.json({ message: "Logged out successfully" });
  });
```

## Security Best Practices

### Token Security
- Use RSA256 algorithm for JWT signing
- Keep private keys secure and rotate regularly
- Set appropriate token expiration times
- Implement token refresh mechanism

### Permission Validation
- Always validate permissions at the route level
- Use principle of least privilege
- Implement audit logging for sensitive operations
- Regular permission reviews and cleanup

### Password Security
- Use bcrypt for password hashing
- Implement password complexity requirements
- Consider implementing password history
- Use secure password reset mechanisms

## OAuth Integration

### Google OAuth
```typescript
// OAuth endpoints handle external authentication
const googleOAuthEndpoint = createHonoRoute()
  .get("/auth/google", async (c) => {
    // Redirect to Google OAuth
    return c.redirect(googleOAuthUrl);
  });

const googleCallbackEndpoint = createHonoRoute()
  .get("/auth/google/callback", async (c) => {
    // Handle OAuth callback
    const code = c.req.query("code");
    const tokens = await exchangeCodeForTokens(code);
    
    // Create or update user
    const user = await createOrUpdateUserFromGoogle(tokens);
    
    // Generate application tokens
    const accessToken = generateAccessToken(user.id);
    
    return c.json({ accessToken });
  });
```

### Microsoft OAuth
Similar pattern for Microsoft OAuth integration with Microsoft Graph API.

## Error Handling

### Common Authentication Errors
```typescript
// Unauthorized - no token or invalid token
throw unauthorized({ message: "Authentication required" });

// Forbidden - valid token but insufficient permissions
throw forbidden({ message: "Insufficient permissions" });

// Bad request - invalid credentials
throw badRequest({ message: "Invalid username or password" });
```

## Related Documentation

- [Route Development](routes.md) - Endpoint creation with auth middleware
- [Database Layer](database.md) - User, role, and permission schemas
- [Security](security.md) - Security considerations and best practices
- [Testing](testing.md) - Testing authentication and authorization
