# AGENTS.md - Backend Development Guide

## 📍 Documentation Location

**All backend documentation has been moved to `docs/backend/`**

Please refer to [`docs/backend/README.md`](../../docs/backend/README.md) for comprehensive backend development documentation.

## 🔗 Quick Links

- **[Complete Backend Documentation](../../docs/backend/README.md)** - Main documentation index
- **[Architecture Overview](../../docs/backend/architecture.md)** - Tech stack and design patterns
- **[Database Guide](../../docs/backend/database.md)** - Drizzle ORM, schema, and migrations
- **[Authentication](../../docs/backend/auth.md)** - JWT, RBAC, and security
- **[Development Tasks](../../docs/backend/development-tasks.md)** - Step-by-step guides
- **[Quick Reference](../../docs/backend/quick-reference.md)** - Commands and code templates

## 📋 Essential Rules

1. **Always use Zod validation** for request data
2. **Single return rule** - one return statement per endpoint
3. **Never edit migration files manually** - use `bun run db:generate`
4. **Use DashboardError** for all error responses
5. **Follow kebab-case** for file names and routes

---

For detailed information about backend development, architecture, and best practices, visit the [backend documentation](../../docs/backend/README.md).
