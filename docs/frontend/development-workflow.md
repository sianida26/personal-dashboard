# Development Workflow

## Overview

This document outlines the development workflow for the frontend application, including step-by-step guides for common development tasks, setup procedures, and best practices for maintaining code quality and consistency.

## Development Environment Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Git for version control
- VS Code (recommended) with extensions

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd dashboard-template

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start development server
npm run dev
```

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript Hero
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (for API testing)

## Project Scripts

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## Development Tasks

### 1. Adding a New Page/Route

#### Step 1: Create Route File
```bash
# Create route file structure
mkdir -p src/routes/_dashboardLayout/users
touch src/routes/_dashboardLayout/users/index.tsx
```

#### Step 2: Define Route Component
```tsx
// src/routes/_dashboardLayout/users/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/components/pages/UsersPage';

export const Route = createFileRoute('/_dashboardLayout/users/')({
  component: UsersPage,
  staticData: {
    title: 'Users',
    description: 'Manage system users',
  },
});
```

#### Step 3: Create Page Component
```tsx
// src/components/pages/UsersPage.tsx
import { createPageTemplate } from '@/components/PageTemplate';
import { client } from '@/lib/honoClient';
import { PERMISSIONS } from '@/constants/permissions';

export const UsersPage = createPageTemplate({
  title: "Users",
  endpoint: client.users.$get,
  queryKey: ["users"],
  createButton: "Create User",
  permissions: [PERMISSIONS.USERS.READ],
  sortableColumns: ["name", "username", "email"],
  columnDefs: (helper) => [
    helper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    helper.accessor("username", {
      header: "Username", 
      cell: (info) => info.getValue(),
    }),
    helper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue(),
    }),
  ],
  actions: {
    edit: (row) => `/users/${row.id}/edit`,
    delete: (row) => ({ 
      endpoint: client.users[":id"].$delete,
      params: { id: row.id },
      permission: PERMISSIONS.USERS.DELETE,
    }),
  },
});
```

#### Step 4: Add Navigation (if needed)
```tsx
// Update sidebar navigation in backend or navigation config
// The navigation items are typically fetched from the backend
```

### 2. Adding a New Component

#### Step 1: Create Component Directory
```bash
mkdir -p src/components/UserCard
touch src/components/UserCard/UserCard.tsx
touch src/components/UserCard/UserCard.test.tsx
touch src/components/UserCard/index.ts
```

#### Step 2: Define Component
```tsx
// src/components/UserCard/UserCard.tsx
import { Card, Text, Badge, Button, Group } from '@mantine/core';
import { User } from '@/types/user';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  showActions?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{user.name}</Text>
        <Badge color={user.role === 'admin' ? 'red' : 'blue'}>
          {user.role}
        </Badge>
      </Group>
      
      <Text size="sm" c="dimmed">
        {user.email}
      </Text>
      
      {showActions && (
        <Group mt="md">
          {onEdit && (
            <Button 
              variant="light" 
              size="sm"
              onClick={() => onEdit(user)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="light" 
              color="red" 
              size="sm"
              onClick={() => onDelete(user)}
            >
              Delete
            </Button>
          )}
        </Group>
      )}
    </Card>
  );
};
```

#### Step 3: Create Index Export
```tsx
// src/components/UserCard/index.ts
export { UserCard } from './UserCard';
export type { UserCardProps } from './UserCard';
```

#### Step 4: Add to Main Components Index
```tsx
// src/components/index.ts
export { UserCard } from './UserCard';
```

#### Step 5: Write Tests
```tsx
// src/components/UserCard/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user' as const,
};

describe('UserCard', () => {
  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it('hides actions when showActions is false', () => {
    render(<UserCard user={mockUser} showActions={false} />);
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
```

### 3. Adding a New Hook

#### Step 1: Create Hook File
```bash
touch src/hooks/useUserPermissions.ts
```

#### Step 2: Implement Hook
```tsx
// src/hooks/useUserPermissions.ts
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';
import { useAuth } from '@/contexts/Auth';

export const useUserPermissions = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user', targetUserId, 'permissions'],
    queryFn: () => client.users[targetUserId!].permissions.$get(),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for updating permissions
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      client.users[userId].permissions.$patch({ json: { permissions } }),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

#### Step 3: Export Hook
```tsx
// src/hooks/index.ts
export { useUserPermissions, useUpdateUserPermissions } from './useUserPermissions';
```

#### Step 4: Write Tests
```tsx
// src/hooks/__tests__/useUserPermissions.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useUserPermissions } from '../useUserPermissions';
import { createTestWrapper } from '@/test/utils';

describe('useUserPermissions', () => {
  it('fetches user permissions', async () => {
    const { result } = renderHook(
      () => useUserPermissions('user-1'),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(['users.read', 'users.write']);
  });

  it('uses current user when no userId provided', async () => {
    const { result } = renderHook(
      () => useUserPermissions(),
      { wrapper: createTestWrapper({ user: { id: 'current-user' } }) }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### 4. Adding Form Components

#### Step 1: Create Form Schema
```tsx
// src/schemas/userSchema.ts
import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['admin', 'user'], { message: 'Role is required' }),
  isActive: z.boolean().default(true),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
```

#### Step 2: Create Form Component
```tsx
// src/components/forms/UserForm.tsx
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { TextInput, Select, Checkbox, Button, Stack } from '@mantine/core';
import { userFormSchema, UserFormValues } from '@/schemas/userSchema';

interface UserFormProps {
  initialValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<UserFormValues>({
    initialValues: {
      name: '',
      email: '',
      username: '',
      role: 'user',
      isActive: true,
      ...initialValues,
    },
    validate: zodResolver(userFormSchema),
  });

  const handleSubmit = async (values: UserFormValues) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Name"
          placeholder="Enter full name"
          {...form.getInputProps('name')}
        />
        
        <TextInput
          label="Email"
          type="email"
          placeholder="Enter email address"
          {...form.getInputProps('email')}
        />
        
        <TextInput
          label="Username"
          placeholder="Enter username"
          {...form.getInputProps('username')}
        />
        
        <Select
          label="Role"
          placeholder="Select role"
          data={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Administrator' },
          ]}
          {...form.getInputProps('role')}
        />
        
        <Checkbox
          label="Active user"
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />
        
        <Button type="submit" loading={isLoading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
};
```

#### Step 3: Create Modal Form
```tsx
// src/components/modals/CreateUserModal.tsx
import { useState } from 'react';
import { Modal, Button } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';
import { showNotification } from '@/utils/notifications';
import { UserForm } from '@/components/forms/UserForm';
import { UserFormValues } from '@/schemas/userSchema';

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  opened,
  onClose,
}) => {
  const queryClient = useQueryClient();
  
  const createUser = useMutation({
    mutationFn: (userData: UserFormValues) => 
      client.users.$post({ json: userData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification({
        message: 'User created successfully',
        color: 'green',
      });
      onClose();
    },
    onError: (error) => {
      showNotification({
        message: error.message || 'Failed to create user',
        color: 'red',
      });
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create User"
      size="md"
    >
      <UserForm
        onSubmit={createUser.mutateAsync}
        isLoading={createUser.isPending}
      />
    </Modal>
  );
};
```

### 5. Adding API Integration

#### Step 1: Define API Types
```tsx
// src/types/api.ts
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}

export interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Step 2: Create API Hooks
```tsx
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';
import { showNotification } from '@/utils/notifications';
import { CreateUserRequest, UpdateUserRequest } from '@/types/api';

// Fetch users with pagination and filtering
export const useUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => client.users.$get({ query: params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single user
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => client.users[userId].$get(),
    enabled: !!userId,
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => 
      client.users.$post({ json: userData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification({
        message: 'User created successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      showNotification({
        message: error.message || 'Failed to create user',
        color: 'red',
      });
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserRequest }) =>
      client.users[userId].$patch({ json: userData }),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      showNotification({
        message: 'User updated successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      showNotification({
        message: error.message || 'Failed to update user',
        color: 'red',
      });
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => 
      client.users[userId].$delete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification({
        message: 'User deleted successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      showNotification({
        message: error.message || 'Failed to delete user',
        color: 'red',
      });
    },
  });
};
```

## Git Workflow

### Branch Strategy
```bash
# Main branches
main          # Production-ready code
develop       # Integration branch for features

# Feature branches
feature/user-management
feature/dashboard-improvements
bugfix/login-issue
hotfix/critical-security-fix
```

### Commit Convention
```bash
# Format: type(scope): description
feat(users): add user management page
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
style(components): fix button styling
refactor(hooks): extract common logic to custom hook
test(users): add user component tests
chore(deps): update dependencies
```

### Development Process

#### 1. Starting New Feature
```bash
# Create and switch to feature branch
git checkout -b feature/user-management

# Make changes and commit
git add .
git commit -m "feat(users): add user management page"

# Push to remote
git push origin feature/user-management
```

#### 2. Code Review Process
```bash
# Create pull request
# - Ensure all tests pass
# - Update documentation
# - Add screenshots if UI changes
# - Request review from team members

# After approval, merge to develop
git checkout develop
git merge feature/user-management
git push origin develop
```

#### 3. Testing Before Release
```bash
# Run all tests
npm run test
npm run test:e2e
npm run typecheck
npm run lint

# Build and test production build
npm run build
npm run preview
```

## Code Quality Checks

### Pre-commit Hooks
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

### Continuous Integration
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Debugging and Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run typecheck

# Check for linting errors
npm run lint
```

#### 2. Test Failures
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test UserCard.test.tsx

# Run tests with coverage
npm run test:coverage
```

#### 3. Performance Issues
```bash
# Analyze bundle size
npm run build:analyze

# Check for memory leaks
npm run dev --inspect
```

### Development Tools

#### Browser Extensions
- React Developer Tools
- TanStack Query DevTools
- Redux DevTools (if using Redux)

#### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Related Documentation

- [Component Patterns](./component-patterns.md) - Component development guidelines
- [Testing](./testing.md) - Testing strategies and setup
- [Best Practices](./best-practices.md) - Coding standards and conventions
- [Architecture](./architecture.md) - System architecture overview
