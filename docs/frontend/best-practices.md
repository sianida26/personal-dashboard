# Best Practices

## Overview

This document outlines the coding standards, conventions, and best practices for the frontend codebase. Following these guidelines ensures consistency, maintainability, and high code quality across the application.

## Code Quality Standards

### TypeScript Best Practices

#### Strict Type Safety
```typescript
// Good: Explicit typing
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const createUser = (userData: UserData): Promise<User> => {
  return client.users.$post({ json: userData });
};

// Avoid: Any types
const createUser = (userData: any): any => {
  return client.users.$post({ json: userData });
};
```

#### Proper Type Definitions
```typescript
// Good: Comprehensive interfaces
interface ComponentProps {
  title: string;
  description?: string;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Good: Union types for specific values
type ButtonVariant = 'primary' | 'secondary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// Good: Generic types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

#### Type Guards and Assertions
```typescript
// Good: Type guards
const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

// Good: Proper type assertions
const userElement = document.getElementById('user') as HTMLDivElement;

// Avoid: Unnecessary type assertions
const user = data as User; // Only if you're certain
```

### React Best Practices

#### Component Structure
```tsx
// Good: Proper component structure
import React from 'react';
import { ComponentProps } from './types';
import { useCustomHook } from './hooks';

interface MyComponentProps extends ComponentProps {
  additionalProp: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  description,
  additionalProp,
  ...props
}) => {
  const { data, isLoading } = useCustomHook();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div {...props}>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      <CustomContent prop={additionalProp} />
    </div>
  );
};
```

#### Hooks Usage
```tsx
// Good: Custom hooks for reusable logic
const useUserData = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => client.users[userId].$get(),
    enabled: !!userId,
  });
  
  return { user: data, isLoading, error };
};

// Good: Proper dependency arrays
useEffect(() => {
  const fetchData = async () => {
    const result = await api.getData(filter);
    setData(result);
  };
  
  fetchData();
}, [filter]); // Include all dependencies

// Good: Cleanup functions
useEffect(() => {
  const subscription = subscribe(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

#### State Management
```tsx
// Good: Proper state structure
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Good: State updates
const handleUserUpdate = (newData: Partial<User>) => {
  setUser(prev => prev ? { ...prev, ...newData } : null);
};

// Good: Derived state
const isUserAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
```

## Naming Conventions

### Files and Directories
```
// Good: Consistent naming
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx
│   └── index.ts
├── UserProfile/
│   ├── UserProfile.tsx
│   ├── UserProfile.test.tsx
│   └── index.ts
└── index.ts

// Good: Route files
routes/
├── _dashboardLayout.tsx
├── _dashboardLayout/
│   ├── users/
│   │   ├── index.tsx
│   │   └── $userId.tsx
│   └── settings/
│       └── index.tsx
└── login/
    └── index.tsx
```

### Variables and Functions
```typescript
// Good: Descriptive names
const userPermissions = ['read', 'write'];
const isUserAuthenticated = !!user;
const fetchUserData = async (userId: string) => { /* ... */ };

// Good: Event handlers
const handleSubmit = (event: FormEvent) => { /* ... */ };
const handleUserClick = (userId: string) => { /* ... */ };
const handleFormChange = (values: FormValues) => { /* ... */ };

// Good: Boolean naming
const isLoading = true;
const hasPermission = false;
const shouldShowModal = true;
const canEdit = user?.role === 'admin';

// Good: Constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 10;
```

### Components and Interfaces
```typescript
// Good: Component naming
export const UserProfileCard: React.FC<UserProfileCardProps> = () => { /* ... */ };
export const DataTable: React.FC<DataTableProps> = () => { /* ... */ };
export const ModalFormTemplate: React.FC<ModalFormTemplateProps> = () => { /* ... */ };

// Good: Interface naming
interface UserData {
  id: string;
  name: string;
}

interface ComponentProps {
  title: string;
  onClick: () => void;
}

// Good: Type naming
type ButtonVariant = 'primary' | 'secondary';
type FormState = 'idle' | 'submitting' | 'success' | 'error';
```

## Performance Optimization

### Component Optimization
```tsx
// Good: Memoization for expensive calculations
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      calculated: expensiveCalculation(item),
    }));
  }, [data]);
  
  return <div>{/* render processedData */}</div>;
};

// Good: Proper memo usage
const MemoizedComponent = React.memo<Props>(({ title, onClick }) => {
  return <button onClick={onClick}>{title}</button>;
});

// Good: Callback memoization
const ParentComponent: React.FC = () => {
  const handleClick = useCallback((id: string) => {
    // handle click
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
};
```

### Query Optimization
```typescript
// Good: Efficient queries
const useUsers = (page: number, filters: UserFilters) => {
  return useQuery({
    queryKey: ['users', page, filters],
    queryFn: () => client.users.$get({ 
      query: { page, ...filters } 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Good: Prefetching
const prefetchNextPage = () => {
  queryClient.prefetchQuery({
    queryKey: ['users', page + 1, filters],
    queryFn: () => client.users.$get({ 
      query: { page: page + 1, ...filters } 
    }),
  });
};
```

### Bundle Optimization
```typescript
// Good: Dynamic imports
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Good: Code splitting by routes
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

// Good: Conditional imports
const loadChart = async () => {
  const { Chart } = await import('./Chart');
  return Chart;
};
```

## Error Handling Best Practices

### Component Error Boundaries
```tsx
// Good: Granular error boundaries
const FeatureErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<FeatureErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Feature error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Good: Specific error handling
const DataComponent: React.FC = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
};
```

### API Error Handling
```typescript
// Good: Structured error handling
const handleApiError = (error: ApiError) => {
  switch (error.status) {
    case 401:
      showNotification({ message: 'Session expired', color: 'red' });
      redirectToLogin();
      break;
    case 403:
      showNotification({ message: 'Access denied', color: 'red' });
      break;
    case 404:
      showNotification({ message: 'Resource not found', color: 'red' });
      break;
    default:
      showNotification({ message: 'An error occurred', color: 'red' });
  }
};
```

## Security Best Practices

### Input Validation
```typescript
// Good: Validate all inputs
const validateUserInput = (input: string): boolean => {
  const sanitized = input.trim();
  return sanitized.length > 0 && sanitized.length <= 100;
};

// Good: Sanitize data
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html);
};
```

### Permission Checks
```tsx
// Good: Component-level permission checks
const AdminOnlyComponent: React.FC = () => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission('admin.access')) {
    return <AccessDenied />;
  }
  
  return <AdminContent />;
};

// Good: Route-level protection
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <ProtectedContent />;
};
```

## Testing Best Practices

### Test Structure
```typescript
// Good: Descriptive test names
describe('UserProfile component', () => {
  describe('when user is authenticated', () => {
    it('should display user information', () => {
      // Test implementation
    });
    
    it('should allow editing profile when user has permission', () => {
      // Test implementation
    });
  });
  
  describe('when user is not authenticated', () => {
    it('should redirect to login page', () => {
      // Test implementation
    });
  });
});
```

### Mock Strategies
```typescript
// Good: Minimal mocking
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

// Good: Reset mocks
afterEach(() => {
  vi.clearAllMocks();
});

// Good: Test behavior, not implementation
it('should create user when form is submitted', async () => {
  const mockCreateUser = vi.fn();
  render(<CreateUserForm onSubmit={mockCreateUser} />);
  
  // Fill form and submit
  await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));
  
  expect(mockCreateUser).toHaveBeenCalledWith({
    name: 'John Doe',
  });
});
```

## Code Organization

### Import Organization
```typescript
// Good: Import order
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { Button, Stack } from '@mantine/core';

// 3. Internal imports (absolute paths)
import { useAuth } from '@/hooks/useAuth';
import { client } from '@/lib/honoClient';
import { UserCard } from '@/components/UserCard';

// 4. Relative imports
import { validateInput } from './utils';
import { ComponentProps } from './types';
```

### File Structure
```typescript
// Good: Consistent file structure
// 1. Imports
// 2. Types and interfaces
// 3. Constants
// 4. Component definition
// 5. Styled components (if any)
// 6. Default export

import React from 'react';
import { ComponentProps } from './types';

interface LocalProps extends ComponentProps {
  additionalProp: string;
}

const DEFAULT_CONFIG = {
  timeout: 5000,
  retries: 3,
};

const MyComponent: React.FC<LocalProps> = ({ additionalProp, ...props }) => {
  // Component implementation
};

export default MyComponent;
```

## Documentation Standards

### Code Comments
```typescript
// Good: Meaningful comments
/**
 * Calculates the user's effective permissions based on role and custom permissions
 * @param user - User object containing role and custom permissions
 * @returns Array of effective permission strings
 */
const calculateEffectivePermissions = (user: User): string[] => {
  const rolePermissions = getRolePermissions(user.role);
  const customPermissions = user.customPermissions || [];
  
  // Combine and deduplicate permissions
  return [...new Set([...rolePermissions, ...customPermissions])];
};

// Good: Complex logic explanation
// This effect handles automatic token refresh
// It sets up a timer that refreshes the token 5 minutes before expiration
useEffect(() => {
  if (!token || !expiresAt) return;
  
  const refreshTime = expiresAt - Date.now() - 5 * 60 * 1000;
  const timer = setTimeout(refreshToken, Math.max(refreshTime, 0));
  
  return () => clearTimeout(timer);
}, [token, expiresAt]);
```

### README Documentation
```markdown
# Component Name

Brief description of what the component does.

## Usage

```tsx
import { ComponentName } from './ComponentName';

const Example = () => (
  <ComponentName 
    title="Example"
    onSubmit={handleSubmit}
  />
);
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | The title to display |
| onSubmit | function | Yes | Callback when form is submitted |

## Examples

### Basic Usage
// Example code

### Advanced Usage
// Example code
```

## Common Pitfalls to Avoid

### React Pitfalls
```tsx
// Avoid: Mutating state directly
const [items, setItems] = useState([]);
items.push(newItem); // Wrong!

// Good: Immutable state updates
setItems(prev => [...prev, newItem]);

// Avoid: Missing keys in lists
{items.map(item => <Item data={item} />)} // Wrong!

// Good: Proper keys
{items.map(item => <Item key={item.id} data={item} />)}

// Avoid: Inline object/function definitions
{items.map(item => (
  <Item 
    key={item.id} 
    data={item} 
    onClick={() => handleClick(item.id)} // Re-renders on every render
  />
))}

// Good: Memoized handlers
const handleClick = useCallback((id: string) => {
  // handle click
}, []);
```

### TypeScript Pitfalls
```typescript
// Avoid: Any types
const handleData = (data: any) => { /* ... */ };

// Good: Proper typing
const handleData = (data: UserData) => { /* ... */ };

// Avoid: Non-null assertions without certainty
const user = getUser()!; // Dangerous!

// Good: Proper null checking
const user = getUser();
if (user) {
  // Use user safely
}
```

### Performance Pitfalls
```tsx
// Avoid: Unnecessary re-renders
const Component = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      {/* This creates a new object on every render */}
      <Child style={{ color: 'red' }} />
    </div>
  );
};

// Good: Memoize or extract constants
const CHILD_STYLE = { color: 'red' };

const Component = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <Child style={CHILD_STYLE} />
    </div>
  );
};
```

## Code Review Guidelines

### Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] Components are properly typed
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Tests are included for new features
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] Documentation is updated if needed

### Review Standards
- Focus on code quality and maintainability
- Suggest improvements, not just point out issues
- Verify test coverage for new features
- Check for accessibility compliance
- Ensure consistent coding style

## Related Documentation

- [Component Patterns](./component-patterns.md) - Component development patterns
- [Testing](./testing.md) - Testing strategies and patterns
- [Error Handling](./error-handling.md) - Error handling best practices
- [Performance](./performance.md) - Performance optimization techniques
