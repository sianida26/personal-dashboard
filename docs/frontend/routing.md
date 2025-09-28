# Routing

## Overview

The frontend uses TanStack Router for file-based routing with full type safety. This provides automatic route generation, type-safe navigation, and powerful features like loaders, guards, and lazy loading.

> IMPORTANT: Always pass the generated `routeTree` (from `routeTree.gen.ts`) to `createRouter({ routeTree, ... })`. Omitting `routeTree` results in a runtime error: `TypeError: flatRoutes is not iterable`. Ensure `import { routeTree } from './routeTree.gen'` exists in `App.tsx` (or wherever the router is created).

## File-Based Routing Structure

### Routing Conventions

#### Basic Route Files
- **`index.tsx`** - Route component (renders at the route path)
- **`index.lazy.tsx`** - Lazy-loaded route component
- **`route.tsx`** - Route configuration without component
- **`$param.tsx`** - Dynamic route parameter
- **`_layout.tsx`** - Layout wrapper for grouped routes

#### Example Structure
```
src/routes/
├── __root.tsx                    # Root layout (/)
├── index.tsx                     # Home page (/)
├── login/
│   ├── index.tsx                 # Login page (/login)
│   └── forgot-password.tsx       # Forgot password (/login/forgot-password)
├── oauth/
│   └── callback.tsx              # OAuth callback (/oauth/callback)
├── _dashboardLayout.tsx          # Dashboard layout wrapper
└── _dashboardLayout/
    ├── index.tsx                 # Dashboard home (/dashboard)
    ├── users/
    │   ├── index.tsx             # Users list (/dashboard/users)
    │   ├── $userId.tsx           # User details (/dashboard/users/123)
    │   └── $userId/
    │       └── edit.tsx          # Edit user (/dashboard/users/123/edit)
    └── settings/
        └── index.tsx             # Settings (/dashboard/settings)
```

### Route Configuration

#### Basic Route Component
```tsx
// src/routes/users/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/components/pages/UsersPage';

export const Route = createFileRoute('/users/')({
  component: UsersPage,
  staticData: {
    title: 'Users',
  },
});
```

#### Route with Loader
```tsx
// src/routes/users/$userId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { UserDetailPage } from '@/components/pages/UserDetailPage';

export const Route = createFileRoute('/users/$userId')({
  component: UserDetailPage,
  loader: async ({ params }) => {
    const user = await client.users[params.userId].$get();
    return { user };
  },
  staticData: {
    title: 'User Details',
  },
});
```

#### Lazy Route
```tsx
// src/routes/users/index.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/users/')({
  component: () => import('@/components/pages/UsersPage').then(m => m.UsersPage),
});
```

## Layout Components

### Root Layout (`__root.tsx`)

The root layout wraps all routes and provides global functionality.

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/Auth';
import { NotificationProvider } from '@/contexts/Notification';

const queryClient = new QueryClient();

const RootComponent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <div className="app">
            <Outlet />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
```

### Protected Layout (`_dashboardLayout.tsx`)

Protected routes that require authentication use the dashboard layout.

```tsx
// src/routes/_dashboardLayout.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

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
  },
  loader: async ({ context }) => {
    const { auth } = context;
    
    // Load user profile and sidebar menu
    const [profile, sidebarMenu] = await Promise.all([
      client.auth.profile.$get(),
      client.auth.sidebar.$get(),
    ]);
    
    return { profile, sidebarMenu };
  },
});
```

## Route Guards and Protection

### Authentication Guard

Routes requiring authentication should use the `_dashboardLayout` wrapper or implement custom guards.

```tsx
// Custom auth guard
export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersPage,
  beforeLoad: async ({ context }) => {
    const { auth } = context;
    
    if (!auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    
    if (!auth.hasPermission('admin.users.read')) {
      throw redirect({ to: '/403' });
    }
  },
});
```

### Permission-Based Guards

```tsx
// Permission guard utility
const requirePermissions = (permissions: string[]) => {
  return async ({ context }) => {
    const { auth } = context;
    
    if (!auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    
    const hasPermission = permissions.some(permission => 
      auth.hasPermission(permission)
    );
    
    if (!hasPermission) {
      throw redirect({ to: '/403' });
    }
  };
};

// Usage
export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersPage,
  beforeLoad: requirePermissions(['admin.users.read']),
});
```

## Navigation

### Programmatic Navigation

```tsx
import { useNavigate } from '@tanstack/react-router';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleNavigation = () => {
    navigate({
      to: '/users/$userId',
      params: { userId: '123' },
      search: { tab: 'profile' },
    });
  };
  
  return <button onClick={handleNavigation}>Go to User</button>;
};
```

### Link Components

```tsx
import { Link } from '@tanstack/react-router';

const Navigation = () => {
  return (
    <nav>
      <Link to="/dashboard" activeProps={{ className: 'active' }}>
        Dashboard
      </Link>
      <Link 
        to="/users/$userId" 
        params={{ userId: '123' }}
        search={{ tab: 'profile' }}
      >
        User Profile
      </Link>
    </nav>
  );
};
```

## Route Parameters and Search

### Dynamic Parameters

```tsx
// Route definition: /users/$userId/edit
export const Route = createFileRoute('/users/$userId/edit')({
  component: EditUserPage,
  loader: async ({ params }) => {
    const { userId } = params; // Type-safe access
    const user = await client.users[userId].$get();
    return { user };
  },
});

// Component usage
const EditUserPage = () => {
  const { user } = Route.useLoaderData();
  const { userId } = Route.useParams();
  
  return <div>Editing user {userId}</div>;
};
```

### Search Parameters

```tsx
// Define search schema
const userSearchSchema = z.object({
  page: z.number().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'email']).optional(),
});

export const Route = createFileRoute('/users/')({
  component: UsersPage,
  validateSearch: userSearchSchema,
  loader: async ({ search }) => {
    const { page = 1, search: query, sort } = search;
    const users = await client.users.$get({
      query: { page, search: query, sort },
    });
    return { users };
  },
});

// Component usage
const UsersPage = () => {
  const navigate = useNavigate();
  const search = Route.useSearch();
  
  const handleSearch = (query: string) => {
    navigate({
      search: { ...search, search: query, page: 1 },
    });
  };
  
  return <SearchInput onSearch={handleSearch} />;
};
```

## Data Loading

### Route Loaders

```tsx
export const Route = createFileRoute('/users/')({
  component: UsersPage,
  loader: async ({ search }) => {
    const users = await client.users.$get({
      query: search,
    });
    return { users };
  },
});
```

### Loader Dependencies

```tsx
export const Route = createFileRoute('/users/$userId')({
  component: UserDetailPage,
  loader: async ({ params, context }) => {
    const { userId } = params;
    const { queryClient } = context;
    
    const user = await queryClient.ensureQueryData({
      queryKey: ['user', userId],
      queryFn: () => client.users[userId].$get(),
    });
    
    return { user };
  },
});
```

## Error Handling

### Route-Level Error Handling

```tsx
export const Route = createFileRoute('/users/')({
  component: UsersPage,
  errorComponent: ({ error }) => (
    <div className="error-page">
      <h1>Error loading users</h1>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  ),
});
```

### Global Error Handling

```tsx
// src/routes/__root.tsx
export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ({ error }) => (
    <div className="global-error">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  ),
});
```

## Static Data and Metadata

### Page Titles

```tsx
export const Route = createFileRoute('/users/')({
  component: UsersPage,
  staticData: {
    title: 'Users',
    description: 'Manage system users',
  },
});

// Access in component
const UsersPage = () => {
  const { title } = Route.useStaticData();
  
  useEffect(() => {
    document.title = title;
  }, [title]);
  
  return <div>{/* component content */}</div>;
};
```

### Breadcrumbs

```tsx
export const Route = createFileRoute('/users/$userId/edit')({
  component: EditUserPage,
  staticData: {
    breadcrumbs: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Users', to: '/users' },
      { label: 'Edit User', to: '' },
    ],
  },
});
```

## Best Practices

### Route Organization
- Group related routes in folders
- Use descriptive route names
- Keep route components focused
- Implement proper error boundaries

### Performance Optimization
- Use lazy loading for large components
- Implement route-level code splitting
- Optimize loader data fetching
- Cache frequently accessed data

### Type Safety
- Define search parameter schemas
- Use proper TypeScript types
- Leverage TanStack Router's type inference
- Validate all route parameters

### Security
- Implement proper authentication guards
- Use permission-based access control
- Validate all user inputs
- Sanitize route parameters

## Related Documentation

- [Authentication](./authentication.md) - Auth guards and protection
- [Component Patterns](./component-patterns.md) - Page components and layouts
- [Data Management](./data-management.md) - Loading and caching strategies
- [Development Workflow](./development-workflow.md) - Adding new routes
