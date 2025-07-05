# Project Structure

## Directory Overview

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

## Detailed Structure

### `/src/components/`
Contains reusable UI components that can be used across different routes.

#### Key Components
- **`PageTemplate.tsx`** - Generic component for CRUD operations with pagination, sorting, and filtering
- **`ModalFormTemplate.tsx`** - Standardized modal forms for create/edit operations
- **`DashboardTable.tsx`** - Data table component with sorting, filtering, and pagination
- **`AppSidebar.tsx`** - Navigation sidebar with dynamic menu items
- **`AppHeader.tsx`** - Top navigation header with user profile and actions

### `/src/routes/`
File-based routing structure following TanStack Router conventions.

#### Routing Conventions
- **`__root.tsx`** - Root layout component
- **`_layout.tsx`** - Layout wrapper for grouped routes
- **`index.tsx`** - Route component (can be lazy-loaded as `index.lazy.tsx`)
- **`$param.tsx`** - Dynamic route parameter
- **`route.tsx`** - Route configuration without component

#### Protected Routes
- **`_dashboardLayout.tsx`** - Protected layout requiring authentication
- **`_dashboardLayout/`** - All dashboard pages inherit authentication requirements

### `/src/contexts/`
React context providers for global state management.

#### Available Contexts
- **`Auth/`** - Authentication state, user data, and permissions
- **`App/`** - Global application state and configuration
- **`Notification/`** - Toast notifications and user feedback

### `/src/hooks/`
Custom React hooks for reusable logic.

#### Common Hooks
- Authentication hooks (`useAuth`, `usePermissions`)
- Data fetching hooks (TanStack Query wrappers)
- Form handling hooks
- UI state management hooks

### `/src/utils/`
Utility functions and helpers.

#### Utility Categories
- API helpers and transformers
- Date/time formatting utilities
- Validation helpers
- Type guards and assertions

### `/src/errors/`
Error handling classes and utilities.

#### Error Types
- Custom error classes extending base Error
- API error handling utilities
- User-friendly error message mappers

### `/src/styles/`
Global CSS and theme configuration.

#### Style Files
- Global CSS imports
- TailwindCSS configuration
- Theme variables and custom properties
- Component-specific styles

### `/src/types/`
TypeScript type definitions and interfaces.

#### Type Categories
- API response types
- Component prop interfaces
- Form schema types
- Global type definitions

## File Naming Conventions

### Components
- **Files**: PascalCase (`UserProfile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Hooks**: camelCase with `use` prefix (`useUserProfile`)

### Routes
- **Files**: kebab-case (`user-profile.tsx`) or special TanStack Router names
- **Layouts**: underscore prefix (`_dashboardLayout.tsx`)
- **Dynamic routes**: dollar prefix (`$userId.tsx`)

### Utilities and Helpers
- **Files**: kebab-case (`api-client.ts`)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

## Import/Export Patterns

### Index Files
Use index files to create clean import paths:

```typescript
// src/components/index.ts
export { PageTemplate } from './PageTemplate';
export { ModalFormTemplate } from './ModalFormTemplate';
export { DashboardTable } from './DashboardTable';
```

### Absolute Imports
Configure path mapping in `tsconfig.json` for clean imports:

```typescript
// Instead of ../../../components/PageTemplate
import { PageTemplate } from '@/components/PageTemplate';
```

### Default vs Named Exports
- **Default exports**: For main component in file
- **Named exports**: For utilities, hooks, and multiple items

## Code Organization Best Practices

### Component Structure
```typescript
// 1. Imports (external, then internal)
// 2. Types and interfaces
// 3. Component definition
// 4. Styled components or styles
// 5. Default export
```

### Hook Organization
```typescript
// 1. React hooks first
// 2. Custom hooks
// 3. External library hooks
// 4. Component-specific logic
```

### File Size Guidelines
- **Components**: < 300 lines (split into smaller components if larger)
- **Hooks**: < 150 lines (extract complex logic)
- **Utilities**: < 100 lines per function
- **Types**: Group related types together

## Related Documentation

- [Architecture](./architecture.md) - Overall system design
- [Component Patterns](./component-patterns.md) - Component development patterns
- [Routing](./routing.md) - File-based routing details
- [Development Workflow](./development-workflow.md) - Adding new files and features
