# Data Management

## Overview

The frontend uses a layered approach to data management with TanStack Query for server state, React Context for authentication, and IndexedDB for client-side persistence. This ensures type safety, efficient caching, and seamless offline capabilities.

## Server State Management

### TanStack Query Integration

TanStack Query handles all server state with automatic caching, background refetching, and optimistic updates.

#### Configuration
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Query Patterns
```typescript
// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => client.users.$get(),
});

// Query with parameters
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => client.users[userId].$get(),
  enabled: !!userId,
});

// Query with search parameters
const { data: users } = useQuery({
  queryKey: ['users', { page, search, sort }],
  queryFn: () => client.users.$get({
    query: { page, search, sort },
  }),
});
```

#### Mutation Patterns
```typescript
// Create mutation
const createUser = useMutation({
  mutationFn: (userData: CreateUserData) => 
    client.users.$post({ json: userData }),
  onSuccess: (newUser) => {
    // Update cache
    queryClient.setQueryData(['users'], (old) => [...old, newUser]);
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['users'] });
    
    // Show success notification
    showNotification({ message: 'User created successfully' });
  },
  onError: (error) => {
    showNotification({ 
      message: 'Failed to create user', 
      color: 'red' 
    });
  },
});

// Update mutation with optimistic update
const updateUser = useMutation({
  mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserData }) =>
    client.users[userId].$patch({ json: userData }),
  onMutate: async ({ userId, userData }) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['user', userId] });
    
    // Snapshot current data
    const previousUser = queryClient.getQueryData(['user', userId]);
    
    // Optimistically update
    queryClient.setQueryData(['user', userId], (old) => ({
      ...old,
      ...userData,
    }));
    
    return { previousUser };
  },
  onError: (error, variables, context) => {
    // Rollback on error
    if (context?.previousUser) {
      queryClient.setQueryData(['user', variables.userId], context.previousUser);
    }
  },
  onSettled: (data, error, variables) => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
  },
});
```

### API Client Integration

#### Hono Client Setup
```typescript
// src/lib/honoClient.ts
import { hc } from 'hono/client';
import type { AppType } from '@backend/src/index';
import { authDB } from '@/lib/authDB';

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

#### Type-Safe API Calls
```typescript
// All API calls are fully type-safe
const response = await client.users.$get({
  query: {
    page: 1,
    limit: 10,
    search: 'john',
  },
});

// TypeScript infers the correct response type
const users = response.data; // User[]
```

### Cache Management

#### Cache Keys Strategy
```typescript
// Consistent cache key patterns
const CACHE_KEYS = {
  users: ['users'] as const,
  user: (id: string) => ['user', id] as const,
  userProfile: ['user', 'profile'] as const,
  userPermissions: (id: string) => ['user', id, 'permissions'] as const,
} as const;

// Usage
const { data } = useQuery({
  queryKey: CACHE_KEYS.user(userId),
  queryFn: () => client.users[userId].$get(),
});
```

#### Cache Invalidation
```typescript
// Specific invalidation
queryClient.invalidateQueries({ queryKey: ['users'] });

// Pattern-based invalidation
queryClient.invalidateQueries({ 
  queryKey: ['user'], 
  exact: false 
});

// Selective invalidation
queryClient.invalidateQueries({
  predicate: (query) => 
    query.queryKey[0] === 'user' && query.queryKey[1] === userId,
});
```

#### Cache Updates
```typescript
// Direct cache update
queryClient.setQueryData(['users'], (old) => 
  old.map(user => 
    user.id === updatedUser.id ? updatedUser : user
  )
);

// Conditional cache update
queryClient.setQueryData(['users'], (old) => {
  if (!old) return old;
  return old.filter(user => user.id !== deletedUserId);
});
```

## Client-Side Persistence

### IndexedDB with Dexie

#### Database Schema
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

#### Data Persistence
```typescript
// Save authentication data
await authDB.auth.put({
  id: 'auth',
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  user: userData,
  permissions: userPermissions,
  expiresAt: Date.now() + (tokens.expiresIn * 1000),
});

// Retrieve authentication data
const authData = await authDB.auth.get('auth');

// Clear authentication data
await authDB.auth.clear();
```

### Offline Support

#### Service Worker Integration
```typescript
// src/lib/serviceWorker.ts
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  }
};
```

#### Offline Query Configuration
```typescript
// Offline-first query
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => client.users.$get(),
  networkMode: 'offlineFirst',
  staleTime: Infinity,
  cacheTime: Infinity,
});
```

## State Management Patterns

### Authentication State

#### Auth Context
```typescript
// src/contexts/Auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { authDB } from '@/lib/authDB';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
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

### Global App State

#### App Context
```typescript
// src/contexts/App/AppContext.tsx
interface AppContextType {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const value = {
    theme,
    sidebarCollapsed,
    setTheme,
    setSidebarCollapsed,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

### Notification State

#### Notification Context
```typescript
// src/contexts/Notification/NotificationContext.tsx
interface NotificationContextType {
  showNotification: (notification: NotificationData) => void;
  hideNotification: (id: string) => void;
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (notification: NotificationData) => {
    const id = generateId();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    if (notification.autoClose !== false) {
      setTimeout(() => {
        hideNotification(id);
      }, notification.duration || 4000);
    }
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};
```

## Data Synchronization

### Real-time Updates

#### WebSocket Integration
```typescript
// src/hooks/useWebSocket.ts
export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };
    
    return () => {
      ws.close();
    };
  }, [url]);

  const handleRealtimeUpdate = (data: any) => {
    // Update relevant queries based on the received data
    queryClient.invalidateQueries({ queryKey: [data.type] });
  };

  return { socket, isConnected };
};
```

### Conflict Resolution

#### Optimistic Updates with Rollback
```typescript
const updateWithConflictResolution = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    // Cancel queries and snapshot current state
    await queryClient.cancelQueries({ queryKey: ['data'] });
    const previousData = queryClient.getQueryData(['data']);
    
    // Optimistically update
    queryClient.setQueryData(['data'], newData);
    
    return { previousData };
  },
  onError: (error, newData, context) => {
    // Handle conflicts
    if (error.status === 409) {
      // Show conflict resolution UI
      showConflictResolutionDialog(error.data);
    } else {
      // Rollback on other errors
      queryClient.setQueryData(['data'], context?.previousData);
    }
  },
});
```

## Performance Optimization

### Query Optimization
```typescript
// Prefetch data
queryClient.prefetchQuery({
  queryKey: ['users'],
  queryFn: () => client.users.$get(),
  staleTime: 5 * 60 * 1000,
});

// Infinite queries for pagination
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: ({ pageParam = 1 }) => 
    client.users.$get({ query: { page: pageParam } }),
  getNextPageParam: (lastPage, pages) => 
    lastPage.hasMore ? pages.length + 1 : undefined,
});
```

### Memory Management
```typescript
// Selective cache clearing
const clearOldCache = () => {
  queryClient.getQueryCache().getAll().forEach(query => {
    if (query.state.dataUpdatedAt < Date.now() - 10 * 60 * 1000) {
      queryClient.removeQueries({ queryKey: query.queryKey });
    }
  });
};
```

## Error Handling

### Query Error Handling
```typescript
// Global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (error.status === 401) {
          // Redirect to login
          window.location.href = '/login';
        } else if (error.status >= 500) {
          // Show server error notification
          showNotification({
            message: 'Server error occurred',
            color: 'red',
          });
        }
      },
    },
  },
});
```

### Network Error Recovery
```typescript
// Retry with exponential backoff
const { data, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => client.users.$get(),
  retry: (failureCount, error) => {
    if (error.status === 404) return false;
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

## Best Practices

### Query Key Management
- Use consistent, hierarchical query keys
- Include all dependencies in query keys
- Use constants for query keys to avoid typos
- Implement proper cache invalidation strategies

### Error Handling
- Implement global error handling
- Provide user-friendly error messages
- Handle different error types appropriately
- Implement retry mechanisms for transient errors

### Performance
- Use query prefetching for predictable navigation
- Implement proper pagination strategies
- Cache frequently accessed data
- Clean up unused cache entries

### Type Safety
- Leverage TypeScript for all data operations
- Use proper type guards for runtime validation
- Implement schema validation for API responses
- Maintain type consistency across the application

## Related Documentation

- [API Client](./api-client.md) - API integration patterns
- [Authentication](./authentication.md) - Auth state management
- [Component Patterns](./component-patterns.md) - Data-driven components
- [Error Handling](./error-handling.md) - Error management strategies
