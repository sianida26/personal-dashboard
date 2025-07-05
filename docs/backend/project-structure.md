# Project Structure

This document describes the complete file and folder organization of the backend codebase.

## Directory Structure

```
apps/backend/
├── src/
│   ├── index.ts                    # Main application entry point
│   ├── appEnv.ts                   # Environment configuration with Zod validation
│   ├── data/                       # Static data definitions
│   │   ├── defaultRoles.ts         # Default role definitions
│   │   └── sidebarMenus.ts         # Sidebar menu configurations
│   ├── drizzle/                    # Database layer (see detailed section below)
│   │   ├── index.ts                # Drizzle ORM initialization
│   │   ├── migration.ts            # Migration runner
│   │   ├── seed.ts                 # Seed runner
│   │   ├── schema/                 # Database schema definitions
│   │   ├── seeds/                  # Seed data files
│   │   ├── migrations/             # Auto-generated migrations (DO NOT EDIT)
│   │   └── utils/                  # Database utilities
│   ├── errors/                     # Custom error classes
│   │   └── DashboardError.ts       # Main error class with factory functions
│   ├── middlewares/                # Hono middleware functions
│   │   ├── authInfo.ts             # User authentication info loader
│   │   ├── authTokenMiddleware.ts  # JWT token validation
│   │   ├── checkPermission.ts      # Permission-based authorization
│   │   ├── protect.ts              # Route protection middleware
│   │   ├── rateLimiter.ts          # Rate limiting middleware
│   │   ├── requestLogger.ts        # HTTP request logging
│   │   └── staticFolder.ts         # Static file serving
│   ├── routes/                     # API endpoint definitions
│   │   ├── auth/                   # Authentication endpoints
│   │   │   ├── post-login.ts       # POST /auth/login
│   │   │   ├── post-logout.ts      # POST /auth/logout
│   │   │   ├── get-me.ts           # GET /auth/me
│   │   │   └── post-refresh.ts     # POST /auth/refresh
│   │   ├── dashboard/              # Dashboard-specific endpoints
│   │   │   └── get-sidebar-items.ts # GET /dashboard/sidebar-items
│   │   ├── dev/                    # Development/testing endpoints
│   │   │   └── get-test.ts         # GET /dev/test
│   │   ├── permissions/            # Permission management endpoints
│   │   │   └── get-permissions.ts  # GET /permissions
│   │   ├── roles/                  # Role management endpoints
│   │   │   ├── get-roles.ts        # GET /roles
│   │   │   ├── post-roles.ts       # POST /roles
│   │   │   └── get-role-by-id.ts   # GET /roles/:id
│   │   ├── users/                  # User management endpoints
│   │   │   ├── get-users.ts        # GET /users
│   │   │   ├── post-users.ts       # POST /users
│   │   │   ├── get-user-by-id.ts   # GET /users/:id
│   │   │   ├── put-user-by-id.ts   # PUT /users/:id
│   │   │   └── delete-user-by-id.ts # DELETE /users/:id
│   │   └── app-settings/           # Application settings endpoints
│   │       ├── get-app-settings.ts # GET /app-settings
│   │       └── put-app-setting.ts  # PUT /app-settings/:key
│   ├── services/                   # Business logic services
│   │   ├── appSettings/            # Application settings service
│   │   └── microsoft/              # Microsoft Graph API integration
│   ├── types/                      # TypeScript type definitions
│   │   ├── HonoEnv.d.ts            # Hono environment type
│   │   ├── RedisKV.d.ts            # Redis key-value type definitions
│   │   └── index.d.ts              # Exported types
│   └── utils/                      # Utility functions
│       ├── authUtils.ts            # Authentication utilities
│       ├── createHonoRoute.ts      # Route factory function
│       ├── logger.ts               # Custom logging implementation
│       ├── passwordUtils.ts        # Password hashing/validation
│       ├── redis.ts                # Redis-like KV store using Drizzle
│       ├── requestValidator.ts     # Request validation helper
│       └── test-utils/             # Testing utilities
│           └── create-user-for-testing.ts  # Test user creation/cleanup
├── package.json                    # Dependencies and scripts
├── drizzle.config.ts              # Drizzle Kit configuration
├── biome.json                     # Code formatting/linting config
└── tsconfig.json                  # TypeScript configuration
```

## Folder Descriptions

### `/src` - Source Code
Main application source code directory.

### `/src/data` - Static Data
Contains static data definitions used throughout the application:
- **`defaultRoles.ts`** - Default role definitions for the RBAC system
- **`sidebarMenus.ts`** - Sidebar menu configurations for the dashboard

### `/src/drizzle` - Database Layer
Complete database layer implementation:
- **`index.ts`** - Drizzle ORM initialization and database connection
- **`migration.ts`** - Migration runner utilities
- **`seed.ts`** - Seed runner utilities
- **`schema/`** - Database schema definitions (one file per table)
- **`seeds/`** - Seed data files
- **`migrations/`** - Auto-generated migrations (DO NOT EDIT MANUALLY)
- **`utils/`** - Database-specific utilities

### `/src/errors` - Error Handling
Custom error classes for consistent error handling:
- **`DashboardError.ts`** - Main error class with factory functions

### `/src/middlewares` - Middleware Functions
Hono middleware functions for cross-cutting concerns:
- **`authInfo.ts`** - Loads user authentication information
- **`authTokenMiddleware.ts`** - JWT token validation
- **`checkPermission.ts`** - Permission-based authorization
- **`protect.ts`** - Route protection middleware
- **`rateLimiter.ts`** - Rate limiting middleware
- **`requestLogger.ts`** - HTTP request logging
- **`staticFolder.ts`** - Static file serving

### `/src/routes` - API Endpoints
API endpoint definitions organized by resource:
- **One endpoint per file** - Each endpoint is a separate file
- **Kebab-case naming** - All files use kebab-case convention
- **Resource-based organization** - Endpoints grouped by resource type

### `/src/services` - Business Logic
Business logic services for complex operations:
- **`appSettings/`** - Application settings service
- **`microsoft/`** - Microsoft Graph API integration

### `/src/types` - TypeScript Types
TypeScript type definitions:
- **`HonoEnv.d.ts`** - Hono environment type definitions
- **`RedisKV.d.ts`** - Redis key-value type definitions
- **`index.d.ts`** - Exported types

### `/src/utils` - Utility Functions
Reusable helper functions:
- **`authUtils.ts`** - Authentication utilities
- **`createHonoRoute.ts`** - Route factory function
- **`logger.ts`** - Custom logging implementation
- **`passwordUtils.ts`** - Password hashing/validation
- **`redis.ts`** - Redis-like KV store using Drizzle
- **`requestValidator.ts`** - Request validation helper
- **`test-utils/`** - Testing utilities directory

## File Naming Conventions

### General Rules
- **Kebab-case** for all file names
- **Lowercase** file extensions
- **Descriptive** names that indicate purpose

### Endpoint Files
- Format: `{method}-{resource}-{action?}.ts`
- Examples:
  - `get-users.ts` - GET /users
  - `post-users.ts` - POST /users
  - `get-user-by-id.ts` - GET /users/:id
  - `put-user-by-id.ts` - PUT /users/:id
  - `delete-user-by-id.ts` - DELETE /users/:id

### Schema Files
- Format: `{resource-name}.ts`
- Examples:
  - `users.ts` - User table schema
  - `roles.ts` - Role table schema
  - `oauth-google.ts` - Google OAuth schema

### Test Files
- Format: `{original-name}.test.ts`
- Examples:
  - `get-users.test.ts` - Tests for GET /users endpoint
  - `auth-utils.test.ts` - Tests for auth utilities

## Configuration Files

### `/package.json`
Dependencies and scripts for the backend application.

### `/drizzle.config.ts`
Drizzle Kit configuration for database operations.

### `/biome.json`
Code formatting and linting configuration.

### `/tsconfig.json`
TypeScript compiler configuration.

## Related Documentation

- [Architecture Overview](architecture.md) - System architecture and design patterns
- [Route Development](routes.md) - Endpoint creation and organization
- [Database Layer](database.md) - Database schema and ORM patterns
- [Best Practices](best-practices.md) - File naming and organization guidelines
