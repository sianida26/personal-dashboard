# Frontend Documentation

Welcome to the comprehensive frontend documentation for the dashboard template project. This documentation covers all aspects of the React-based frontend implementation, from architecture to development workflows.

## 📚 Documentation Structure

### Core Architecture & Design
- **[Architecture](./architecture.md)** - System architecture, tech stack, and design patterns
- **[Project Structure](./project-structure.md)** - Directory organization and file conventions
- **[Component Patterns](./component-patterns.md)** - Reusable component templates and patterns

### Development & Implementation
- **[Routing](./routing.md)** - File-based routing with TanStack Router
- **[Data Management](./data-management.md)** - State management, API integration, and caching
- **[Authentication](./authentication.md)** - JWT authentication, RBAC, and permission system
- **[Form Handling](./form-handling.md)** - Form validation, submission, and state management

### Operations & Maintenance
- **[Error Handling](./error-handling.md)** - Error boundaries, API errors, and recovery strategies
- **[Testing](./testing.md)** - Testing strategies, utilities, and best practices
- **[Best Practices](./best-practices.md)** - Coding standards, conventions, and optimization

### Developer Resources
- **[Development Workflow](./development-workflow.md)** - Step-by-step guides for common tasks
- **[Quick Reference](./quick-reference.md)** - Commands, templates, and patterns
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Start

For new developers, we recommend reading the documentation in this order:

1. **[Architecture](./architecture.md)** - Understand the system design and tech stack
2. **[Project Structure](./project-structure.md)** - Learn the codebase organization
3. **[Component Patterns](./component-patterns.md)** - Master the component development patterns
4. **[Development Workflow](./development-workflow.md)** - Follow step-by-step development guides
5. **[Best Practices](./best-practices.md)** - Learn coding standards and conventions

## 🔧 Essential Commands

```bash
# Development
npm run dev                # Start development server
npm run test              # Run unit tests
npm run test:e2e          # Run E2E tests
npm run typecheck         # Type checking
npm run lint              # Lint code
npm run format            # Format code

# Production
npm run build             # Build for production
npm run preview           # Preview production build
```

## 🏗️ Tech Stack Overview

### Core Framework
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework

### Routing & Navigation
- **TanStack Router** - File-based routing with type safety
- **React Router** - Client-side routing

### Data Management
- **TanStack Query** - Server state management
- **Hono Client** - Type-safe API client
- **IndexedDB** - Client-side persistence
- **Mantine Forms** - Form state management

### UI Components
- **Custom UI Library** (`@repo/ui`) - Shared component system
- **Tabler Icons** - Icon library
- **Radix UI** - Headless component primitives
- **Mantine** - Component library and hooks

## 📋 Key Principles

1. **Type Safety First** - Everything is strongly typed with TypeScript
2. **Component-Driven** - Reusable, composable components
3. **Performance** - Optimized rendering and bundle size
4. **Accessibility** - WCAG compliant and keyboard navigable
5. **Testing** - Comprehensive test coverage
6. **Developer Experience** - Great DX with modern tooling

## 🎯 Architecture Highlights

### File-Based Routing
- Automatic route generation from file structure
- Type-safe navigation and parameters
- Lazy loading and code splitting
- Route-level data loading and error handling

### Data Management
- Server state with TanStack Query
- Client state with React Context
- Persistent storage with IndexedDB
- Type-safe API integration

### Component System
- Template-based components for common patterns
- Configuration-driven UI generation
- Consistent styling and behavior
- Comprehensive error boundaries

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based UI rendering
- Automatic token refresh

## 🤝 Contributing

When contributing to the frontend:

1. Follow the coding standards in [Best Practices](./best-practices.md)
2. Use the development workflow in [Development Workflow](./development-workflow.md)
3. Write tests for all new features (see [Testing](./testing.md))
4. Follow the component patterns in [Component Patterns](./component-patterns.md)
5. Update documentation when making changes

## 📞 Support

- Check [Troubleshooting](./troubleshooting.md) for common issues
- Review [Quick Reference](./quick-reference.md) for syntax and patterns
- Refer to specific documentation sections for detailed guidance
- Use the development tools and debugging techniques outlined in the docs

## 🔗 Related Resources

- [Backend Documentation](../backend/README.md) - Backend API documentation
- [UI Library Documentation](../../packages/ui/README.md) - Shared component library
- [Project README](../../README.md) - Project overview and setup

---

*This documentation is maintained alongside the codebase. When making changes, please update the relevant documentation files.*
