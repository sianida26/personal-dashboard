# Backend Architecture Overview

This document provides comprehensive guidance for working with the **HonoJS + Drizzle ORM + PostgreSQL** backend codebase. The backend is part of a monorepo structure and follows strict architectural patterns for scalability and maintainability.

## Tech Stack

- **Framework**: HonoJS (TypeScript-first web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Runtime**: Bun (development)
- **Package Manager**: Bun (all dependency management and script execution)
- **Authentication**: JWT tokens with role-based access control (RBAC)
- **Validation**: Zod schemas (shared via `@repo/validation`)
- **Logging**: Custom logger with file-based logging
- **Rate Limiting**: Built-in rate limiting middleware
- **OAuth**: Google & Microsoft OAuth providers

## Key Design Patterns

- **Modular endpoints** - Each endpoint is a separate file with complete path
- **Single return rule** - Each endpoint has exactly ONE return statement, all errors must throw
- **Kebab-case naming** - All files use kebab-case convention
- **Middleware-based architecture** - Authentication, authorization, logging, rate limiting
- **Type-safe environment** - Custom HonoEnv type with Variables
- **Permission-based access control** - Granular permissions system
- **Database-first approach** - Schema definitions drive API design
- **Error handling** - Custom DashboardError class for consistent error responses

## Architecture Principles

### 1. Separation of Concerns
- **Routes**: Handle HTTP requests and responses
- **Services**: Business logic and complex operations
- **Middleware**: Cross-cutting concerns (auth, logging, validation)
- **Utils**: Reusable helper functions
- **Types**: TypeScript type definitions

### 2. Type Safety
- TypeScript strict mode enabled
- Custom HonoEnv type for environment variables
- Zod schemas for runtime validation
- Drizzle ORM for type-safe database operations

### 3. Error Handling
- Custom DashboardError class for consistent error responses
- Single return statement per endpoint
- All error cases must throw, never return

### 4. Security
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based authorization
- Rate limiting
- Input validation and sanitization

### 5. Scalability
- Modular architecture
- Middleware-based request processing
- Database connection pooling
- Efficient query patterns

## Related Documentation

- [Project Structure](project-structure.md) - Detailed file organization
- [Route Development](routes.md) - Endpoint creation patterns
- [Database Layer](database.md) - Database and ORM patterns
- [Authentication & Authorization](auth.md) - Security implementation
