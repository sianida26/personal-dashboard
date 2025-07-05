# Quick Reference

## Essential Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run typecheck
```

### File Generation
```bash
# Generate new page
npm run generate:page <PageName>

# Generate new component
npm run generate:component <ComponentName>

# Generate new hook
npm run generate:hook <HookName>
```

## Common Patterns

### Component Template
```tsx
import React from 'react';
import { ComponentProps } from './types';

interface MyComponentProps extends ComponentProps {
  title: string;
  description?: string;
  onAction?: (data: any) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  description,
  onAction,
  ...props
}) => {
  return (
    <div {...props}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onAction && (
        <button onClick={() => onAction({ type: 'click' })}>
          Action
        </button>
      )}
    </div>
  );
};
```

### Hook Template
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';

export const useMyData = (id: string) => {
  return useQuery({
    queryKey: ['my-data', id],
    queryFn: () => client.data[id].$get(),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MyData) => client.data.$post({ json: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-data'] });
    },
  });
};
```

### Form Template
```tsx
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof formSchema>;

export const MyForm: React.FC = () => {
  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      email: '',
    },
    validate: zodResolver(formSchema),
  });

  const handleSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Name"
        {...form.getInputProps('name')}
      />
      <TextInput
        label="Email"
        {...form.getInputProps('email')}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
};
```

### Page Template
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { createPageTemplate } from '@/components/PageTemplate';

export const Route = createFileRoute('/my-page/')({
  component: MyPage,
  staticData: {
    title: 'My Page',
    description: 'Page description',
  },
});

const MyPage = createPageTemplate({
  title: "My Data",
  endpoint: client.myData.$get,
  queryKey: ["my-data"],
  createButton: "Create Item",
  columnDefs: (helper) => [
    helper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    helper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue(),
    }),
  ],
});
```

## Type Definitions

### Common Types
```typescript
// API Response wrapper
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Pagination
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Component props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Form props
interface FormProps<T> {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void>;
  isLoading?: boolean;
}
```

### User Types
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  isActive?: boolean;
}
```

## Validation Schemas

### Common Schemas
```typescript
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean().default(true),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Password schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');
```

## API Patterns

### Query Patterns
```typescript
// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => client.users.$get(),
});

// Query with parameters
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => client.users[userId].$get(),
  enabled: !!userId,
});

// Query with search
const { data } = useQuery({
  queryKey: ['users', { search, page }],
  queryFn: () => client.users.$get({ query: { search, page } }),
});
```

### Mutation Patterns
```typescript
// Create mutation
const createUser = useMutation({
  mutationFn: (userData) => client.users.$post({ json: userData }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// Update mutation
const updateUser = useMutation({
  mutationFn: ({ id, data }) => client.users[id].$patch({ json: data }),
  onSuccess: (data, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user', id] });
  },
});

// Delete mutation
const deleteUser = useMutation({
  mutationFn: (id) => client.users[id].$delete(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

## Routing Patterns

### Route Structure
```
src/routes/
├── __root.tsx                    # Root layout
├── index.tsx                     # Home page (/)
├── login/
│   └── index.tsx                 # Login page (/login)
├── _dashboardLayout.tsx          # Protected layout
└── _dashboardLayout/
    ├── index.tsx                 # Dashboard (/dashboard)
    ├── users/
    │   ├── index.tsx             # Users list (/dashboard/users)
    │   └── $userId.tsx           # User detail (/dashboard/users/:userId)
    └── settings/
        └── index.tsx             # Settings (/dashboard/settings)
```

### Route Definitions
```tsx
// Basic route
export const Route = createFileRoute('/users/')({
  component: UsersPage,
  staticData: {
    title: 'Users',
  },
});

// Route with loader
export const Route = createFileRoute('/users/$userId')({
  component: UserDetailPage,
  loader: ({ params }) => fetchUser(params.userId),
});

// Protected route
export const Route = createFileRoute('/_dashboardLayout')({
  component: DashboardLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});
```

## Permission Patterns

### Permission Constants
```typescript
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
  },
} as const;
```

### Permission Checks
```tsx
// Hook usage
const { hasPermission } = useAuth();

// Component usage
<PermissionGate permissions={PERMISSIONS.USERS.CREATE}>
  <CreateUserButton />
</PermissionGate>

// Conditional rendering
{hasPermission(PERMISSIONS.USERS.UPDATE) && (
  <EditButton />
)}
```

## Error Handling Patterns

### Error Boundaries
```tsx
// Component error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>

// Route error handling
export const Route = createFileRoute('/users/')({
  component: UsersPage,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
});
```

### API Error Handling
```typescript
// Query error handling
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  onError: (error) => {
    showNotification({
      message: error.message,
      color: 'red',
    });
  },
});

// Mutation error handling
const mutation = useMutation({
  mutationFn: createUser,
  onError: (error) => {
    if (error.status === 400) {
      // Handle validation errors
    } else {
      showNotification({
        message: 'Failed to create user',
        color: 'red',
      });
    }
  },
});
```

## Testing Patterns

### Component Testing
```typescript
// Basic component test
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});

// Component with user interaction
import userEvent from '@testing-library/user-event';

test('handles click', async () => {
  const user = userEvent.setup();
  const mockClick = vi.fn();
  
  render(<MyComponent onClick={mockClick} />);
  await user.click(screen.getByRole('button'));
  
  expect(mockClick).toHaveBeenCalled();
});
```

### Hook Testing
```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from './useMyHook';

test('returns expected value', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current.value).toBe('expected');
});
```

## Configuration Files

### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite Config
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## Environment Variables

### Development
```bash
# .env.development
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Dashboard Template
VITE_ENABLE_MOCK=false
```

### Production
```bash
# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Dashboard Template
VITE_ENABLE_MOCK=false
```

## Debugging

### Browser DevTools
```javascript
// Console debugging
console.log('Debug info:', { data, error, isLoading });

// Performance measurement
console.time('Component render');
// ... component code
console.timeEnd('Component render');

// React DevTools
// Install React Developer Tools browser extension
```

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Performance Tips

### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Check for duplicate dependencies
npm ls --depth=0
```

### Code Splitting
```typescript
// Route-level splitting
const LazyPage = React.lazy(() => import('./LazyPage'));

// Component-level splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Dynamic imports
const loadFeature = () => import('./feature');
```

### Memoization
```typescript
// Expensive calculations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Callback memoization
const memoizedCallback = useCallback(() => {
  handleAction();
}, [dependency]);

// Component memoization
const MemoizedComponent = React.memo(MyComponent);
```

## Related Documentation

- [Architecture](./architecture.md) - System design and patterns
- [Component Patterns](./component-patterns.md) - Component development
- [Development Workflow](./development-workflow.md) - Development process
- [Best Practices](./best-practices.md) - Coding standards
