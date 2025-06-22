# Frontend Documentation for LLMs

## Project Overview

This is a React-based frontend application built with modern TypeScript, designed as part of a comprehensive dashboard template. The frontend follows component-driven architecture with strict patterns for routing, data management, and UI consistency.

## Tech Stack & Key Dependencies

### Core Framework
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework

### Routing & Navigation
- **TanStack Router** - File-based routing with type safety
- File-based routing structure under `src/routes/`
- Supports lazy loading, loaders, and route guards

### Data Management
- **TanStack Query** - Server state management
- **Hono Client** - Type-safe API client for backend communication
- **IndexedDB** (via Dexie) - Client-side data persistence
- **Mantine Forms** - Form state management with validation

### UI Components
- **Custom UI Library** (`@repo/ui`) - Shared component system
- **Tabler Icons** - Icon library
- **Radix UI** - Headless component primitives
- **Mantine Hooks** - Utility hooks for common patterns

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── PageTemplate.tsx # Generic table/CRUD page component
│   ├── ModalFormTemplate.tsx # Modal form wrapper
│   ├── DashboardTable.tsx # Data table component
│   ├── AppSidebar.tsx   # Navigation sidebar
│   └── AppHeader.tsx    # Top navigation header
├── routes/              # File-based routing
│   ├── __root.tsx       # Root layout
│   ├── _dashboardLayout.tsx # Protected dashboard layout
│   ├── _dashboardLayout/ # Dashboard pages
│   ├── login/           # Authentication pages
│   └── oauth/           # OAuth callback handlers
├── contexts/            # React context providers
│   ├── Auth/            # Authentication context
│   ├── App/             # Global app state
│   └── Notification/    # Toast notifications
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── errors/              # Error handling
├── styles/              # Global CSS and themes
└── types/               # TypeScript type definitions
```

## Design Patterns & Conventions

### File-Based Routing
- Uses TanStack Router with file-based routing
- Route files follow naming conventions:
  - `index.tsx` or `index.lazy.tsx` - Route component
  - `$param.tsx` - Dynamic route parameter
  - `_layout.tsx` - Layout wrapper
- Routes support static data for page titles
- Protected routes use `_dashboardLayout` wrapper

### Component Patterns

#### 1. Page Components (`PageTemplate`)
- Generic component for CRUD operations
- Handles pagination, sorting, filtering
- Integrates with backend APIs automatically
- Supports server-side and client-side operations

```tsx
// Example usage
createPageTemplate({
  title: "Users",
  endpoint: client.users.$get,
  queryKey: ["users"],
  createButton: "Create User",
  sortableColumns: ["name", "username"],
  columnDefs: (helper) => [/* column definitions */]
})
```

#### 2. Modal Forms (`ModalFormTemplate`)
- Standardized modal forms for create/edit operations
- Integrates with Mantine forms and TanStack Query
- Handles loading states and success/error feedback

#### 3. Input Components (`createInputComponents`)
- Type-safe input generation from configuration
- Supports all common input types (text, select, multi-select, etc.)
- Handles readonly/disabled states consistently

### Data Fetching Patterns

#### API Client
- Type-safe Hono client connected to backend
- Automatic authorization header injection
- Located at `src/honoClient.ts`

```typescript
const client = hc<AppType>(backendUrl, {
  headers: async () => {
    const authData = await authDB.auth.get("auth");
    return {
      Authorization: `Bearer ${authData?.accessToken ?? ""}`,
    };
  },
});
```

#### Query Management
- Uses TanStack Query for server state
- Consistent query key patterns
- Automatic cache invalidation on mutations

### Authentication & Authorization

#### Authentication Context
- Centralized auth state management
- Persists to IndexedDB
- Provides user data, permissions, and tokens

#### Permission System
- Role-based access control (RBAC)
- Permission checking via `usePermissions` hook
- Automatic redirects to 403 for unauthorized access

```typescript
// Permission check examples
usePermissions("users.create");
usePermissions(["users.read", "users.update"]);
usePermissions("authenticated-only");
```

### Form Management

#### Mantine Forms Integration
- Type-safe form validation with Zod
- Automatic form state management
- Integration with `createInputComponents`

```typescript
const form = useForm<z.infer<typeof userFormSchema>>({
  initialValues: { /* defaults */ },
  validate: zodResolver(userFormSchema),
});
```

### Navigation & Layout

#### Dashboard Layout
- Protected layout requiring authentication
- Includes sidebar navigation and header
- Fetches user profile and sidebar menu items
- Handles auth errors and redirects

#### Sidebar Navigation
- Dynamic menu items from backend
- Icon integration with Tabler Icons
- Active route highlighting
- User profile dropdown

## Code Generation & Templates

### Turbo Generators
- Automated page generation for CRUD operations
- Templates for create, edit, detail, and list pages
- Consistent patterns across all generated code

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

## Error Handling

### Error Boundaries
- Custom error classes extending base Error
- Type-safe error responses from backend
- User-friendly error messages and fallbacks

### Response Error Handling
- Standardized error response parsing
- Toast notifications for user feedback
- Automatic retry mechanisms where appropriate

## Critical Rules & Best Practices

### 1. Component Development
- **Always use TypeScript** - No JavaScript files allowed
- **Extract reusable logic** into custom hooks
- **Use the UI library** - Don't create custom components when library versions exist
- **Follow the PageTemplate pattern** for CRUD pages

### 2. Data Management
- **Use TanStack Query** for all server state
- **Implement optimistic updates** where appropriate
- **Cache invalidation** must be explicit and predictable
- **Type-safe API calls** using the Hono client

### 3. Routing & Navigation
- **File-based routing only** - No programmatic route configuration
- **Use lazy loading** for non-critical routes
- **Implement proper route guards** for protected pages
- **Static data for page titles** in route definitions

### 4. Form Handling
- **Mantine forms with Zod validation** - No other form libraries
- **Use createInputComponents** for consistent form UIs
- **Implement proper loading states** during submission
- **Handle form errors gracefully** with user feedback

### 5. State Management
- **Server state**: TanStack Query only
- **Auth state**: AuthContext + IndexedDB persistence
- **UI state**: Local component state with useState
- **Global state**: AppContext for cross-component data

## Testing Considerations
- Components should be testable in isolation
- Mock API calls using MSW or similar
- Test user interactions and form submissions
- Verify permission-based rendering

## Common Pitfalls to Avoid

1. **Don't bypass the component patterns** - Use PageTemplate and ModalFormTemplate
2. **Don't mix auth mechanisms** - Use the established auth context
3. **Don't ignore TypeScript errors** - Fix all type issues
4. **Don't create duplicate API calls** - Reuse existing queries
5. **Don't hardcode permissions** - Use the permission system
6. **Don't skip error handling** - Always handle loading and error states

## Development Workflow

### Adding New Pages
1. Create route files following naming conventions
2. Use PageTemplate for list views
3. Create modal forms for create/edit operations
4. Add appropriate permission checks
5. Update navigation if needed

### Adding New Components
1. Check if similar component exists in UI library
2. Follow TypeScript patterns strictly
3. Implement proper prop interfaces
4. Add error boundaries where appropriate
5. Document complex component usage

### API Integration
1. Use the existing Hono client
2. Define proper TypeScript types
3. Implement TanStack Query patterns
4. Handle loading and error states
5. Implement cache invalidation strategies

## Summary

This frontend follows a component-driven architecture with strict TypeScript patterns, file-based routing, and comprehensive data management. The key principles are type safety, reusability, consistent patterns, and seamless backend integration. All components should follow the established patterns, use the provided abstractions, and maintain the high standard of type safety throughout the application.

When developing new features, always start with the existing patterns and components before creating new ones. This ensures consistency, maintainability, and adherence to the established architecture.
