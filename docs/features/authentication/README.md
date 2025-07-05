# Authentication Implementation

This document provides comprehensive details about the authentication system implementation in the dashboard template.

## Overview

The authentication system provides secure user authentication and authorization using JWT tokens with role-based access control (RBAC). It supports both local authentication and OAuth providers (Google, GitHub, etc.).

## Architecture

### Backend Authentication
- **JWT Token System**: Access tokens (short-lived) and refresh tokens (long-lived)
- **Password Hashing**: bcrypt for secure password storage
- **Session Management**: Redis-based session storage for enhanced security
- **OAuth Integration**: Support for multiple OAuth providers
- **Rate Limiting**: Login attempt protection and API rate limiting

### Frontend Authentication
- **Authentication Context**: Centralized auth state management
- **Token Storage**: IndexedDB for persistent token storage
- **Route Guards**: Protected routes with permission checking
- **Auto-refresh**: Automatic token refresh on expiry
- **Permission System**: Role-based UI component rendering

## Backend Implementation

### Core Components

#### Authentication Service (`src/services/auth.service.ts`)
```typescript
class AuthService {
  // User registration and login
  async register(userData: RegisterRequest): Promise<AuthResponse>
  async login(credentials: LoginRequest): Promise<AuthResponse>
  
  // Token management
  async refreshToken(refreshToken: string): Promise<AuthResponse>
  async revokeToken(token: string): Promise<void>
  
  // Password management
  async changePassword(userId: string, passwords: ChangePasswordRequest): Promise<void>
  async resetPassword(email: string): Promise<void>
  
  // OAuth integration
  async oauthLogin(provider: string, code: string): Promise<AuthResponse>
}
```

#### JWT Service (`src/services/jwt.service.ts`)
```typescript
class JWTService {
  // Token generation
  generateAccessToken(payload: JWTPayload): string
  generateRefreshToken(payload: JWTPayload): string
  
  // Token validation
  verifyAccessToken(token: string): JWTPayload | null
  verifyRefreshToken(token: string): JWTPayload | null
  
  // Token utilities
  extractTokenFromHeader(header: string): string | null
  isTokenExpired(token: string): boolean
}
```

### API Endpoints

#### Authentication Routes (`/api/auth/*`)

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| POST | `/api/auth/register` | Register new user | `RegisterRequest` | `AuthResponse` |
| POST | `/api/auth/login` | User login | `LoginRequest` | `AuthResponse` |
| POST | `/api/auth/refresh` | Refresh access token | `RefreshRequest` | `AuthResponse` |
| POST | `/api/auth/logout` | User logout | - | `SuccessResponse` |
| POST | `/api/auth/change-password` | Change password | `ChangePasswordRequest` | `SuccessResponse` |
| POST | `/api/auth/forgot-password` | Request password reset | `ForgotPasswordRequest` | `SuccessResponse` |
| POST | `/api/auth/reset-password` | Reset password | `ResetPasswordRequest` | `SuccessResponse` |
| GET | `/api/auth/profile` | Get user profile | - | `UserProfile` |
| PUT | `/api/auth/profile` | Update user profile | `UpdateProfileRequest` | `UserProfile` |

#### OAuth Routes (`/api/oauth/*`)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/oauth/{provider}` | Initiate OAuth flow | `redirect_uri` | Redirect to provider |
| GET | `/api/oauth/{provider}/callback` | Handle OAuth callback | `code`, `state` | `AuthResponse` |
| GET | `/api/oauth/providers` | List available providers | - | `OAuthProvider[]` |

### Data Models

The authentication system uses the following data models:

- **User Model**: See [User Management Data Models](../user-management/README.md#data-models)
- **Role Model**: See [Role Management Data Models](../role-management/README.md#data-models)
- **Permission Model**: See [Permission Management Data Models](../permission-management/README.md#data-models)

For the complete data model definitions, including database schema and validation rules, refer to the respective feature documentation.

### Request/Response Types

#### Authentication Requests
```typescript
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

#### Authentication Responses
```typescript
interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}
```

### Middleware

#### Authentication Middleware (`src/middlewares/auth.middleware.ts`)
```typescript
export const authMiddleware = async (c: Context, next: Next) => {
  const token = extractTokenFromHeader(c.req.header('Authorization'));
  
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const payload = jwtService.verifyAccessToken(token);
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  c.set('user', payload);
  await next();
};
```

#### Permission Middleware (`src/middlewares/permission.middleware.ts`)
```typescript
export const requirePermission = (permission: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user || !user.permissions.includes(permission)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
};
```

### Security Features

#### Password Security
- **bcrypt Hashing**: Minimum 12 rounds for password hashing
- **Password Policies**: Minimum length, complexity requirements
- **Password History**: Prevent reuse of recent passwords

#### Token Security
- **Short-lived Access Tokens**: 15-minute expiry
- **Secure Refresh Tokens**: 7-day expiry, stored securely
- **Token Rotation**: New refresh token issued on each refresh
- **Blacklisting**: Revoked tokens are blacklisted

#### Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes per IP
- **API Calls**: 100 requests per minute per user
- **Password Reset**: 3 attempts per hour per email

## Frontend Implementation

### Authentication Context (`src/contexts/Auth/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
}
```

### Authentication Hooks

#### useAuth Hook
```typescript
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### usePermissions Hook
```typescript
const usePermissions = (requiredPermissions: string | string[]) => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return false;
    
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    return permissions.every(permission => 
      user.permissions.includes(permission)
    );
  }, [user, requiredPermissions]);
};
```

### Route Protection

#### Protected Route Component
```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode; permission?: string }> = ({
  children,
  permission
}) => {
  const { isAuthenticated, user } = useAuth();
  const hasPermission = usePermissions(permission || 'authenticated-only');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (permission && !hasPermission) {
    return <Navigate to="/403" replace />;
  }
  
  return <>{children}</>;
};
```

### Token Management

#### Token Storage (IndexedDB)
```typescript
class AuthDatabase {
  private db: Dexie;
  
  async storeTokens(tokens: TokenPair): Promise<void> {
    await this.db.auth.put({
      id: 'tokens',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
    });
  }
  
  async getTokens(): Promise<TokenPair | null> {
    const stored = await this.db.auth.get('tokens');
    return stored ? {
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      expiresAt: stored.expiresAt
    } : null;
  }
  
  async clearTokens(): Promise<void> {
    await this.db.auth.delete('tokens');
  }
}
```

#### API Client Integration
```typescript
const apiClient = hc<AppType>(API_BASE_URL, {
  headers: async () => {
    const tokens = await authDB.getTokens();
    return {
      Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
    };
  }
});
```

## Configuration

### Environment Variables

#### Backend
```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url

# Email Configuration (for password reset)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

#### Frontend
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Dashboard Template

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

## Usage Examples

### Backend Usage

#### Protecting Routes
```typescript
// Require authentication
app.get('/api/protected', authMiddleware, (c) => {
  return c.json({ message: 'Protected resource' });
});

// Require specific permission
app.get('/api/admin', authMiddleware, requirePermission('admin.access'), (c) => {
  return c.json({ message: 'Admin resource' });
});
```

#### User Registration
```typescript
app.post('/api/auth/register', async (c) => {
  const userData = await c.req.json();
  const result = await authService.register(userData);
  return c.json(result);
});
```

### Frontend Usage

#### Login Form
```tsx
const LoginForm = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};
```

#### Permission-based Component Rendering
```tsx
const AdminPanel = () => {
  const hasAdminAccess = usePermissions('admin.access');
  const canManageUsers = usePermissions('users.manage');
  
  if (!hasAdminAccess) {
    return <div>Access denied</div>;
  }
  
  return (
    <div>
      <h1>Admin Panel</h1>
      {canManageUsers && (
        <UserManagement />
      )}
    </div>
  );
};
```

## Testing

### Backend Testing
```typescript
// Auth service tests
describe('AuthService', () => {
  it('should register a new user', async () => {
    const userData = { email: 'test@example.com', password: 'password123' };
    const result = await authService.register(userData);
    expect(result.user.email).toBe(userData.email);
  });
  
  it('should login with valid credentials', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await authService.login(credentials);
    expect(result.accessToken).toBeDefined();
  });
});
```

### Frontend Testing
```typescript
// Auth context tests
describe('AuthContext', () => {
  it('should authenticate user on login', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });
    
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## Error Handling

### Common Error Scenarios
- **Invalid Credentials**: Wrong email/password combination
- **Token Expiry**: Access token has expired
- **Permission Denied**: User lacks required permissions
- **Account Locked**: Too many failed login attempts
- **Email Not Verified**: Account requires email verification

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}
```

## Troubleshooting

### Common Issues

1. **Token Refresh Failures**
   - Check refresh token validity
   - Verify token storage in IndexedDB
   - Ensure proper error handling

2. **Permission Checks Failing**
   - Verify user roles and permissions
   - Check permission middleware implementation
   - Ensure proper permission format

3. **OAuth Integration Issues**
   - Verify OAuth client configurations
   - Check redirect URI settings
   - Ensure proper state parameter handling

### Debug Tools
- **JWT Decoder**: Decode tokens to inspect payload
- **Network Inspector**: Monitor API calls and responses
- **Console Logging**: Auth context state changes
- **Database Queries**: Verify user data and permissions

## Best Practices

1. **Security**
   - Use HTTPS in production
   - Implement proper CORS policies
   - Regular security audits
   - Keep dependencies updated

2. **Performance**
   - Implement token refresh logic
   - Cache user permissions
   - Optimize database queries
   - Use connection pooling

3. **User Experience**
   - Smooth login/logout flows
   - Clear error messages
   - Auto-logout on token expiry
   - Remember user preferences

4. **Maintainability**
   - Centralized auth logic
   - Consistent error handling
   - Comprehensive testing
   - Clear documentation

## Migration Guide

### Version Updates
When updating the authentication system:

1. **Database Migrations**: Update user schema if needed
2. **Token Migration**: Handle existing tokens gracefully
3. **Permission Updates**: Migrate permission structures
4. **Breaking Changes**: Document and communicate changes

### Backward Compatibility
- Maintain API compatibility when possible
- Provide migration tools for major changes
- Support legacy token formats temporarily
- Clear deprecation timeline

## Related Documentation

- [User Management](../user-management/README.md)
- [Role Management](../role-management/README.md)
- [API Security](../../backend/security.md)
- [Frontend Security](../../frontend/security.md)
