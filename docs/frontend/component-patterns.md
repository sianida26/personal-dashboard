# Component Patterns

## Overview

The frontend follows established component patterns to ensure consistency, reusability, and maintainability. These patterns provide standardized approaches to common UI requirements like CRUD operations, forms, and data display.

## Core Component Templates

### 1. Page Components (`PageTemplate`)

Generic component for CRUD operations that handles pagination, sorting, filtering, and integrates with backend APIs automatically.

#### Features
- Server-side and client-side operations
- Automatic pagination and sorting
- Built-in filtering capabilities
- Type-safe column definitions
- Loading and error states
- Permission-based action visibility

#### Usage Example
```tsx
import { createPageTemplate } from '@/components/PageTemplate';

const UsersPage = createPageTemplate({
  title: "Users",
  endpoint: client.users.$get,
  queryKey: ["users"],
  createButton: "Create User",
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
      params: { id: row.id }
    }),
  },
});
```

#### Configuration Options
- **`title`**: Page title displayed in header
- **`endpoint`**: API endpoint for data fetching
- **`queryKey`**: TanStack Query key for caching
- **`createButton`**: Text for create button (optional)
- **`sortableColumns`**: Array of column keys that support sorting
- **`columnDefs`**: TanStack Table column definitions
- **`actions`**: Object defining available row actions
- **`permissions`**: Required permissions for different actions

### 2. Modal Forms (`ModalFormTemplate`)

Standardized modal forms for create/edit operations with integrated loading states and success/error feedback.

#### Features
- Mantine forms integration
- TanStack Query mutations
- Loading states during submission
- Success/error feedback via toasts
- Automatic form reset on success
- Validation error display

#### Usage Example
```tsx
import { ModalFormTemplate } from '@/components/ModalFormTemplate';

const UserFormModal = () => {
  return (
    <ModalFormTemplate
      title="Create User"
      formSchema={userFormSchema}
      onSubmit={async (values) => {
        await client.users.$post({ json: values });
      }}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }}
      renderForm={(form) => (
        <Stack>
          <TextInput
            label="Name"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Username"
            {...form.getInputProps("username")}
          />
          <TextInput
            label="Email"
            type="email"
            {...form.getInputProps("email")}
          />
        </Stack>
      )}
    />
  );
};
```

#### Configuration Options
- **`title`**: Modal title
- **`formSchema`**: Zod schema for validation
- **`onSubmit`**: Async submit handler
- **`onSuccess`**: Success callback
- **`renderForm`**: Function to render form inputs
- **`size`**: Modal size (xs, sm, md, lg, xl)
- **`closeOnSuccess`**: Whether to close modal on success

### 3. Input Components (`createInputComponents`)

Type-safe input generation from configuration that supports all common input types with consistent styling and behavior.

#### Features
- Type-safe input generation
- Automatic validation display
- Consistent styling across inputs
- Support for all common input types
- Readonly/disabled state handling
- Dynamic options for selects

#### Usage Example
```tsx
import { createInputComponents } from '@/components/InputComponents';

const userInputs = createInputComponents({
  name: {
    type: 'text',
    label: 'Full Name',
    required: true,
    placeholder: 'Enter full name',
  },
  email: {
    type: 'email',
    label: 'Email Address',
    required: true,
    placeholder: 'Enter email address',
  },
  role: {
    type: 'select',
    label: 'Role',
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'user', label: 'User' },
    ],
  },
  permissions: {
    type: 'multi-select',
    label: 'Permissions',
    options: permissionOptions,
  },
  isActive: {
    type: 'checkbox',
    label: 'Active User',
  },
});

// Usage in form
<form>
  {userInputs.name(form.getInputProps("name"))}
  {userInputs.email(form.getInputProps("email"))}
  {userInputs.role(form.getInputProps("role"))}
</form>
```

#### Supported Input Types
- **`text`**: Basic text input
- **`email`**: Email input with validation
- **`password`**: Password input
- **`number`**: Number input
- **`textarea`**: Multi-line text input
- **`select`**: Single selection dropdown
- **`multi-select`**: Multiple selection dropdown
- **`checkbox`**: Boolean checkbox
- **`radio`**: Radio button group
- **`date`**: Date picker
- **`datetime`**: Date and time picker

## Layout Components

### Dashboard Layout (`_dashboardLayout`)

Protected layout component that requires authentication and provides the main dashboard structure.

#### Features
- Authentication requirement
- Sidebar navigation
- Top header with user profile
- Main content area
- Loading states during auth check
- Error handling for auth failures

#### Structure
```tsx
export const DashboardLayout = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="dashboard-layout">
      <AppSidebar />
      <div className="main-content">
        <AppHeader />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### App Sidebar

Dynamic navigation sidebar with menu items from backend and user profile management.

#### Features
- Dynamic menu items from API
- Icon integration with Tabler Icons
- Active route highlighting
- User profile dropdown
- Collapsible navigation groups
- Permission-based menu filtering

### App Header

Top navigation header with user actions and global controls.

#### Features
- User profile dropdown
- Notification center
- Search functionality
- Theme toggle
- Mobile menu trigger
- Breadcrumb navigation

## Data Display Components

### Dashboard Table

Enhanced table component with sorting, filtering, and pagination capabilities.

#### Features
- TanStack Table integration
- Server-side sorting and filtering
- Pagination controls
- Row selection
- Bulk actions
- Export functionality
- Responsive design

#### Usage Example
```tsx
<DashboardTable
  data={users}
  columns={userColumns}
  pagination={{
    pageSize: 10,
    pageCount: totalPages,
    currentPage: page,
    onPageChange: setPage,
  }}
  sorting={{
    sortBy: sortBy,
    sortOrder: sortOrder,
    onSortChange: handleSort,
  }}
  selection={{
    selectedRows: selectedUsers,
    onSelectionChange: setSelectedUsers,
  }}
/>
```

## Form Components

### Form Validation

All forms use Zod schemas for type-safe validation with consistent error handling.

#### Pattern
```typescript
// Schema definition
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"]),
});

// Form usage
const form = useForm<z.infer<typeof userFormSchema>>({
  initialValues: {
    name: "",
    email: "",
    role: "user",
  },
  validate: zodResolver(userFormSchema),
});
```

### Form State Management

Consistent form state management using Mantine Forms with TanStack Query for submissions.

#### Pattern
```typescript
const { mutate: createUser, isPending } = useMutation({
  mutationFn: (values: UserFormValues) => 
    client.users.$post({ json: values }),
  onSuccess: () => {
    form.reset();
    queryClient.invalidateQueries({ queryKey: ["users"] });
    showNotification({ message: "User created successfully" });
  },
  onError: (error) => {
    showNotification({ 
      message: "Failed to create user", 
      color: "red" 
    });
  },
});
```

## Error Handling Patterns

### Error Boundaries

Strategic error boundaries to prevent app crashes and provide user-friendly error messages.

#### Implementation
```tsx
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Loading States

Consistent loading state handling across all components.

#### Pattern
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: () => client.users.$get(),
});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <UserList users={data} />;
```

## Best Practices

### Component Composition
- Prefer composition over inheritance
- Use render props for flexible components
- Implement proper prop interfaces
- Follow single responsibility principle

### Performance Optimization
- Use React.memo for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders
- Use lazy loading for large components

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## Related Documentation

- [Data Management](./data-management.md) - State management patterns
- [Form Handling](./form-handling.md) - Form validation and submission
- [Authentication](./authentication.md) - Auth-related components
- [Development Workflow](./development-workflow.md) - Creating new components
