# Frontend Architecture

## Overview

This is a React-based frontend application built with modern TypeScript, designed as part of a comprehensive dashboard template. The frontend follows component-driven architecture with strict patterns for routing, data management, and UI consistency.

## Tech Stack & Key Dependencies

### Core Framework
- **React 18** - Component-based UI framework with concurrent features
- **TypeScript** - Type-safe JavaScript with strict configuration
- **Vite** - Modern build tool and development server
- **TailwindCSS** - Utility-first CSS framework for rapid UI development

### Routing & Navigation
- **TanStack Router** - File-based routing with type safety
- File-based routing structure under `src/routes/`
- Supports lazy loading, loaders, and route guards
- Type-safe navigation with automatic route generation

### Data Management
- **TanStack Query** - Server state management with caching
- **Hono Client** - Type-safe API client for backend communication
- **IndexedDB** (via Dexie) - Client-side data persistence
- **Mantine Forms** - Form state management with validation

### UI Components
- **Custom UI Library** (`@repo/ui`) - Shared component system
- **Tabler Icons** - Comprehensive icon library
- **Radix UI** - Headless component primitives
- **Mantine Hooks** - Utility hooks for common patterns

## Architecture Principles

### Component-Driven Development
- Reusable, composable components
- Clear separation of concerns
- Props-driven configuration
- Consistent patterns across the application

### Type Safety First
- Strict TypeScript configuration
- End-to-end type safety from API to UI
- Zod schema validation
- Runtime type checking where needed

### State Management Strategy
- **Server State**: TanStack Query for all API data
- **Auth State**: Context + IndexedDB persistence
- **UI State**: Local component state with useState
- **Global State**: AppContext for cross-component data

### Performance Considerations
- Lazy loading for non-critical routes
- Component-level code splitting
- Optimistic updates for better UX
- Efficient re-rendering with React patterns

## Design Patterns

### Template-Based Architecture
- Generic templates for common patterns (CRUD, forms, modals)
- Configuration-driven UI generation
- Consistent behavior across similar components
- Reduced code duplication

### Composition Over Inheritance
- Component composition for complex UIs
- Higher-order components for cross-cutting concerns
- Render props and children patterns
- Flexible, reusable component APIs

### Error Boundaries and Resilience
- Strategic error boundaries to prevent app crashes
- Graceful degradation for failed components
- User-friendly error messages
- Retry mechanisms for transient failures

## Integration Points

### Backend Communication
- Type-safe API client using Hono
- Automatic authentication header injection
- Consistent error handling across API calls
- Request/response transformation

### Authentication Integration
- JWT-based authentication
- Role-based access control (RBAC)
- Automatic token refresh
- Protected route handling

### Real-time Features
- WebSocket integration for live updates
- Optimistic updates for immediate feedback
- Conflict resolution for concurrent edits
- Event-driven state synchronization

## Development Philosophy

### Developer Experience
- Hot module replacement for instant feedback
- Comprehensive TypeScript support
- Automatic code generation for repetitive tasks
- Clear error messages and debugging tools

### Maintainability
- Consistent coding patterns
- Clear documentation and comments
- Automated testing strategies
- Refactoring-friendly architecture

### Scalability
- Modular architecture for team development
- Clear boundaries between features
- Extensible component system
- Performance optimization strategies

## Related Documentation

- [Project Structure](./project-structure.md) - File organization and conventions
- [Component Patterns](./component-patterns.md) - Reusable component templates
- [Data Management](./data-management.md) - State management and API integration
- [Routing](./routing.md) - File-based routing and navigation
- [Authentication](./authentication.md) - Auth system and permission handling
