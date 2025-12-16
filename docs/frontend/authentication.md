# Authentication & Authorization

## Overview

The frontend implements a comprehensive authentication and authorization system using JWT tokens, role-based access control (RBAC), and client-side permission management. The system integrates with IndexedDB for persistent storage and provides seamless user experience with automatic token refresh.

## Authentication Flow

### Login Process

#### Login Component
```tsx
// src/components/auth/LoginForm.tsx
import { useAuth } from '@/contexts/Auth';
import { useForm } from '@mantine/form';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginForm = () => {
  const { login, isLoading } = useAuth();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: zodResolver(loginSchema),
  });

  const handleSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values);
    } catch (error) {
      form.setFieldError('username', 'Invalid credentials');
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Username"
        {...form.getInputProps('username')}
      />
      <PasswordInput
        label="Password"
        {...form.getInputProps('password')}
      />
      <Button type="submit" loading={isLoading}>
        Login
      </Button>
    </form>
  );
};
```

#### Login Settings Fetch & Resilience

- The `/login` route loader (`apps/frontend/src/routes/login/index.tsx`) fetches `/auth/login-settings` once and merges the result with safe defaults.
- If the endpoint is rate limited or returns a non-JSON body, the loader falls back to default settings (username/password enabled, social OAuth disabled) and shows an inline notice on the login page instead of blocking the form.
- The shared `fetchRPC` helper now defends against non-JSON error payloads (e.g., `429 Too Many Requests` text responses) to avoid `Unexpected token` JSON parse failures.
- Keep the login flow functional during upstream hiccups; avoid adding aggressive retries that could trip rate limits.

#### Authentication Context
```typescript
// src/contexts/Auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { authDB } from '@/lib/authDB';
import { client } from '@/lib/honoClient';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const authData = await authDB.auth.get('auth');

      if (authData && authData.expiresAt > Date.now()) {
        setUser(authData.user);
        setPermissions(authData.permissions);

        // Setup token refresh
        setupTokenRefresh(authData.expiresAt);
      } else if (authData?.refreshToken) {
        // Try to refresh token
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await client.auth.login.$post({
        json: credentials
      });

      const authData = {
        id: 'auth',
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
        permissions: response.permissions,
        expiresAt: Date.now() + (response.expiresIn * 1000),
      };

      await authDB.auth.put(authData);

      setUser(response.user);
      setPermissions(response.permissions);
      setupTokenRefresh(authData.expiresAt);

    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    try {
      await client.auth.logout.$post();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await authDB.auth.clear();
      setUser(null);
      setPermissions([]);
    }
  };

  const refreshToken = async () => {
    try {
      const authData = await authDB.auth.get('auth');
      if (!authData?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await client.auth.refresh.$post({
        json: { refreshToken: authData.refreshToken },
      });

      const newAuthData = {
        ...authData,
        accessToken: response.accessToken,
        expiresAt: Date.now() + (response.expiresIn * 1000),
      };

      await authDB.auth.put(newAuthData);
      setupTokenRefresh(newAuthData.expiresAt);

    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const setupTokenRefresh = (expiresAt: number) => {
    const refreshTime = expiresAt - Date.now() - 5 * 60 * 1000; // 5 minutes before expiry

    setTimeout(() => {
      refreshToken();
    }, Math.max(refreshTime, 0));
  };

  const hasPermission = (permission: string | string[]) => {
    if (Array.isArray(permission)) {
      return permission.some(p => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  const value = {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Token Management

#### IndexedDB Storage
```typescript
// src/lib/authDB.ts
import Dexie, { Table } from 'dexie';

export interface AuthData {
  id: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  permissions: string[];
  expiresAt: number;
}

export class AuthDatabase extends Dexie {
  auth!: Table<AuthData>;

  constructor() {
    super('DashboardAuth');
    this.version(1).stores({
      auth: '++id, accessToken, refreshToken, user, permissions, expiresAt',
    });
  }
}

export const authDB = new AuthDatabase();
```

#### Automatic Token Injection
```typescript
// src/lib/honoClient.ts
import { hc } from 'hono/client';
import type { AppType } from '@backend/src/index';
import { authDB } from './authDB';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const client = hc<AppType>(backendUrl, {
  headers: async () => {
    const authData = await authDB.auth.get("auth");
    return {
      Authorization: `Bearer ${authData?.accessToken ?? ""}`,
    };
  },
});
```

## Authorization System

### Role-Based Access Control (RBAC)

#### Permission System
```typescript
// Permission constants
export const PERMISSIONS = {
  USERS: {
    READ: 'users.read',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
  },
  ADMIN: {
    DASHBOARD: 'admin.dashboard',
    SETTINGS: 'admin.settings',
    USERS: 'admin.users',
  },
  AUTHENTICATED: 'authenticated-only',
} as const;

// Permission groups
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
  ],
  ADMIN_ACCESS: [
    PERMISSIONS.ADMIN.DASHBOARD,
    PERMISSIONS.ADMIN.SETTINGS,
    PERMISSIONS.ADMIN.USERS,
  ],
} as const;
```

#### Permission Hooks
```typescript
// src/hooks/usePermissions.ts
import { useAuth } from '@/contexts/Auth';

export const usePermissions = (requiredPermissions: string | string[]) => {
  const { hasPermission, isAuthenticated } = useAuth();

  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  const hasAccess = permissions.every(permission => {
    if (permission === 'authenticated-only') {
      return isAuthenticated;
    }
    return hasPermission(permission);
  });

  return {
    hasAccess,
    checkPermission: hasPermission,
  };
};

// Multiple permission strategies
export const useAnyPermission = (permissions: string[]) => {
  const { hasPermission } = useAuth();
  return permissions.some(permission => hasPermission(permission));
};

export const useAllPermissions = (permissions: string[]) => {
  const { hasPermission } = useAuth();
  return permissions.every(permission => hasPermission(permission));
};
```

### Component-Level Authorization

#### Permission-Based Rendering
```tsx
// src/components/auth/PermissionGate.tsx
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permissions: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permissions,
  children,
  fallback = null,
  requireAll = true,
}) => {
  const { hasAccess } = usePermissions(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Usage example
<PermissionGate permissions={PERMISSIONS.USERS.CREATE}>
  <Button onClick={handleCreateUser}>Create User</Button>
</PermissionGate>

<PermissionGate
  permissions={[PERMISSIONS.USERS.READ, PERMISSIONS.USERS.UPDATE]}
  requireAll={false}
>
  <UserTable />
</PermissionGate>
```

#### Conditional Components
```tsx
// src/components/auth/AuthorizedComponent.tsx
interface AuthorizedComponentProps {
  permissions: string | string[];
  component: React.ComponentType;
  props?: any;
  fallback?: React.ComponentType;
}

export const AuthorizedComponent: React.FC<AuthorizedComponentProps> = ({
  permissions,
  component: Component,
  props = {},
  fallback: Fallback,
}) => {
  const { hasAccess } = usePermissions(permissions);

  if (!hasAccess) {
    return Fallback ? <Fallback {...props} /> : null;
  }

  return <Component {...props} />;
};
```

### Route Protection

#### Protected Route Component
```tsx
// src/components/auth/ProtectedRoute.tsx
import { useAuth } from '@/contexts/Auth';
import { Navigate } from '@tanstack/react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string | string[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissions,
  requireAuth = true,
}) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permissions) {
    const hasAccess = Array.isArray(permissions)
      ? permissions.some(p => hasPermission(p))
      : hasPermission(permissions);

    if (!hasAccess) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
};
```

#### Route Guards in TanStack Router
```tsx
// src/routes/_dashboardLayout.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { PERMISSIONS } from '@/constants/permissions';

export const Route = createFileRoute('/_dashboardLayout')({
  component: DashboardLayout,
  beforeLoad: async ({ context }) => {
    const { auth } = context;

    if (!auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: window.location.pathname,
        },
      });
    }

    if (!auth.hasPermission(PERMISSIONS.AUTHENTICATED)) {
      throw redirect({ to: '/403' });
    }
  },
});

// Admin-only route
export const AdminRoute = createFileRoute('/_dashboardLayout/admin')({
  component: AdminPage,
  beforeLoad: async ({ context }) => {
    const { auth } = context;

    if (!auth.hasPermission(PERMISSIONS.ADMIN.DASHBOARD)) {
      throw redirect({ to: '/403' });
    }
  },
});
```

## OAuth Integration

### OAuth Flow
```tsx
// src/components/auth/OAuthLogin.tsx
export const OAuthLogin = () => {
  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/oauth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div>
      <Button onClick={handleGoogleLogin}>
        Sign in with Google
      </Button>
    </div>
  );
};
```

### OAuth Callback Handler
```tsx
// src/routes/oauth/callback.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/contexts/Auth';

const OAuthCallback = () => {
  const { login } = useAuth();
  const search = Route.useSearch();

  useEffect(() => {
    const handleCallback = async () => {
      if (search.code) {
        try {
          await login({ oauthCode: search.code });
        } catch (error) {
          console.error('OAuth login failed:', error);
        }
      }
    };

    handleCallback();
  }, [search.code, login]);

  return <div>Processing login...</div>;
};

export const Route = createFileRoute('/oauth/callback')({
  component: OAuthCallback,
  validateSearch: z.object({
    code: z.string().optional(),
    error: z.string().optional(),
  }),
});
```

## Permission Management

### Dynamic Permission Loading
```typescript
// src/hooks/useUserPermissions.ts
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';

export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId, 'permissions'],
    queryFn: () => client.users[userId].permissions.$get(),
    enabled: !!userId,
  });
};

// Update permissions
export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      client.users[userId].permissions.$patch({ json: { permissions } }),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId, 'permissions'] });
    },
  });
};
```

### Permission Caching
```typescript
// src/hooks/usePermissionCache.ts
export const usePermissionCache = () => {
  const queryClient = useQueryClient();

  const cachePermissions = (userId: string, permissions: string[]) => {
    queryClient.setQueryData(['user', userId, 'permissions'], permissions);
  };

  const getCachedPermissions = (userId: string) => {
    return queryClient.getQueryData(['user', userId, 'permissions']) as string[] | undefined;
  };

  return { cachePermissions, getCachedPermissions };
};
```

## Security Best Practices

### Token Security
- Store tokens in IndexedDB (not localStorage)
- Implement automatic token refresh
- Clear tokens on logout
- Use secure HTTP headers

### Permission Validation
- Always validate permissions on backend
- Use frontend permissions for UI only
- Implement fallback error handling
- Regular permission audits

### Error Handling
```typescript
// src/utils/authErrors.ts
export const handleAuthError = (error: any) => {
  if (error.status === 401) {
    // Token expired or invalid
    return 'Session expired. Please login again.';
  } else if (error.status === 403) {
    // Insufficient permissions
    return 'You do not have permission to access this resource.';
  } else if (error.status === 429) {
    // Rate limited
    return 'Too many login attempts. Please try again later.';
  }
  return 'An authentication error occurred.';
};
```

## Testing Authentication

### Auth Context Testing
```typescript
// src/contexts/Auth/__tests__/AuthContext.test.tsx
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  it('should provide authentication state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username: 'test', password: 'test' });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Permission Testing
```typescript
// src/hooks/__tests__/usePermissions.test.tsx
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';

describe('usePermissions', () => {
  it('should check single permission', () => {
    const { result } = renderHook(() => usePermissions('users.read'));

    expect(result.current.hasAccess).toBe(true);
  });

  it('should check multiple permissions', () => {
    const { result } = renderHook(() => usePermissions(['users.read', 'users.write']));

    expect(result.current.hasAccess).toBe(false);
  });
});
```

## Related Documentation

- [Data Management](./data-management.md) - Auth state management
- [Routing](./routing.md) - Route protection and guards
- [Component Patterns](./component-patterns.md) - Auth-aware components
- [Error Handling](./error-handling.md) - Auth error management
