# Backend Documentation

This directory contains comprehensive documentation for the backend codebase, broken down by topic for easier navigation and maintenance.

## 📁 Documentation Structure

### Core Architecture
- **[Overview & Architecture](architecture.md)** - System overview, tech stack, and design patterns
- **[Project Structure](project-structure.md)** - Complete file and folder organization

### Database & ORM
- **[Database Layer](database.md)** - Drizzle ORM, schemas, migrations, and database patterns
- **[Validation & Type Safety](validation.md)** - Zod schemas, request validation, and type safety patterns

### Background Processing
- **[Job Queue System](jobs.md)** - Asynchronous job processing, worker management, and background tasks

### API Development
- **[Route Development](routes.md)** - Endpoint creation, naming conventions, and patterns
- **[Authentication & Authorization](auth.md)** - JWT, RBAC, permissions, and middleware
- **[API Documentation](api-docs.md)** - Response formats, query parameters, and standards
- **[Notifications Module](notifications.md)** - Endpoints, orchestration, eventing, and seeding

### Development Workflow
- **[Common Development Tasks](development-tasks.md)** - Step-by-step guides for common tasks
- **[Testing](testing.md)** - Test structure, utilities, and best practices
- **[Logging & Debugging](logging.md)** - Logger usage, log files, and debugging tips

### Configuration & Deployment
- **[Security](security.md)** - Security considerations and best practices

### Reference Materials
- **[Best Practices](best-practices.md)** - Do's and don'ts, performance tips
- **[Quick Reference](quick-reference.md)** - Commands, generators, and common patterns
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

## 🚀 Getting Started

If you're new to this codebase, start with:
1. **[Overview & Architecture](architecture.md)** - Understand the system
2. **[Project Structure](project-structure.md)** - Learn the file organization
3. **[Route Development](routes.md)** - Learn how to create endpoints
4. **[Database Layer](database.md)** - Understand the data layer
5. **[Job Queue System](jobs.md)** - Learn background task processing
6. **[Testing](testing.md)** - Learn how to test your code

## 📋 Quick Navigation

### For Development
- Need to create a new endpoint? → [Common Development Tasks](development-tasks.md#1-adding-a-new-endpoint)
- Need to add a database table? → [Common Development Tasks](development-tasks.md#2-adding-a-new-database-table)
- Need to add middleware? → [Common Development Tasks](development-tasks.md#3-adding-new-middleware)
- Need to process background tasks? → [Job Queue System](jobs.md#getting-started)

### For Troubleshooting
- Tests failing? → [Troubleshooting](troubleshooting.md#test-debugging-checklist)
- Database issues? → [Troubleshooting](troubleshooting.md#database-connection-issues)
- Permission errors? → [Troubleshooting](troubleshooting.md#permission-errors)
- Job queue issues? → [Job Queue System](jobs.md#troubleshooting)

### For Reference
- Commands and scripts? → [Quick Reference](quick-reference.md#essential-commands)
- File naming conventions? → [Best Practices](best-practices.md#naming-conventions)
- Error handling patterns? → [Routes](routes.md#error-handling-pattern)

## 🔗 Related Documentation

- [Frontend Documentation](../frontend/README.md) - Frontend codebase documentation
- [Version System](../VERSION_SYSTEM.md) - Project versioning system
- [Main Project README](../../README.md) - Project overview

---

*This documentation is maintained alongside the codebase. When making changes, please update the relevant documentation files.*
