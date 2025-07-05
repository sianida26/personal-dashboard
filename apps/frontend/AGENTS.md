# Frontend Documentation for LLMs

> **⚠️ This documentation has been reorganized!**
> 
> The complete frontend documentation has been moved to **`docs/frontend/`** for better organization and maintainability.

## 📚 Complete Documentation

**👉 [Go to docs/frontend/README.md](../../docs/frontend/README.md)** for the full frontend documentation index.

## 🚀 Quick Start

Essential commands and patterns for immediate development:

```bash
# Start development server
bun dev

# Run tests
bun test

# Build for production
bun build

# Type check
bun type-check
```

## 🔑 Critical Rules

When developing frontend code, **always follow these non-negotiable rules**:

### 1. **TypeScript First**
- No JavaScript files allowed
- Fix all TypeScript errors before committing
- Use proper type definitions for all props and functions

### 2. **Component Patterns**
- Use `PageTemplate` for CRUD pages - don't create custom table pages
- Use `ModalFormTemplate` for create/edit operations
- Follow the established component patterns in the documentation

### 3. **Data Management**
- Use `TanStack Query` for all server state management
- Use the type-safe `Hono client` for API calls
- Implement proper loading states and error handling

### 4. **Form Handling**
- Use `Mantine forms` with `Zod validation` only
- Use `createInputComponents` for consistent form UIs
- Always handle form submission errors gracefully

### 5. **Authentication & Authorization**
- Use the established `AuthContext` and permission system
- Check permissions with `usePermissions` hook
- Never bypass the authentication flow

## 📖 Documentation Structure

The complete documentation is organized into focused sections:

- **[Architecture](../../docs/frontend/architecture.md)** - Tech stack, design patterns, and system overview
- **[Project Structure](../../docs/frontend/project-structure.md)** - Directory organization and file conventions
- **[Component Patterns](../../docs/frontend/component-patterns.md)** - PageTemplate, ModalFormTemplate, and component guidelines
- **[Routing](../../docs/frontend/routing.md)** - File-based routing with TanStack Router
- **[Data Management](../../docs/frontend/data-management.md)** - TanStack Query, API client, and state management
- **[Authentication](../../docs/frontend/authentication.md)** - Auth flow, permissions, and security
- **[Form Handling](../../docs/frontend/form-handling.md)** - Mantine forms, validation, and patterns
- **[Error Handling](../../docs/frontend/error-handling.md)** - Error boundaries and user feedback
- **[Testing](../../docs/frontend/testing.md)** - Testing strategies and best practices
- **[Best Practices](../../docs/frontend/best-practices.md)** - Coding standards and conventions
- **[Development Workflow](../../docs/frontend/development-workflow.md)** - Step-by-step development guides
- **[Quick Reference](../../docs/frontend/quick-reference.md)** - Commands, templates, and common patterns

## 🎯 For AI Development

When implementing features:

1. **Start with the patterns** - Check existing components and follow established patterns
2. **Review the documentation** - Each section provides specific guidance and examples
3. **Follow the workflow** - Use the development workflow guides for step-by-step instructions
4. **Test thoroughly** - Implement proper error handling and loading states

**Remember**: The frontend follows strict architectural patterns. Don't reinvent the wheel - use the established components and patterns documented in `docs/frontend/`.
