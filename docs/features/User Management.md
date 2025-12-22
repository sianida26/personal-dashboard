# User Management

## Contents

1. [Overview](#overview)
2. [Flows](#flows)
3. [Database Schema](#database-schema)
4. [Important Notes](#important-notes)
5. [Revision History](#revision-history)

---

## Overview

Comprehensive user, role, and permission management system with RBAC (Role-Based Access Control) supporting both direct permission assignment and role-based inheritance.

**Key Features:**
- User CRUD with soft-delete (trash/restore/permanent delete)
- Hierarchical permission system (user-direct + role-inherited)
- Protected system roles (Super Admin cannot be deleted)
- Advanced data table with server-side pagination, search, filtering, and sorting
- Real-time notifications on user creation

**Authorization Model:**
```
User Effective Permissions = Direct Permissions ∪ Role Permissions
```

---

## Flows

### User Creation Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant NS as Notification Service

    Admin->>FE: Submit create user form
    FE->>BE: POST /users {name, username, password, roles}
    BE->>BE: Validate form (unique username)
    BE->>BE: Hash password (bcrypt)
    BE->>DB: Insert user record
    BE->>DB: Insert roles_to_users (if roles provided)
    BE->>NS: Send notification to Super Admins
    NS-->>Admin: Notify user created
    BE-->>FE: 200 OK {message}
    FE->>FE: Invalidate users query
    FE-->>Admin: Show success toast
```

### Soft Delete & Restore Flow

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant BE as Backend
    participant DB as Database

    Admin->>BE: DELETE /users/:id (skipTrash=false)
    BE->>DB: UPDATE users SET deleted_at = NOW()
    BE-->>Admin: 200 OK

    Note over DB: User still in database<br/>Refresh tokens CASCADE deleted

    Admin->>BE: PATCH /users/restore/:id
    BE->>DB: Check if user.deleted_at IS NOT NULL
    BE->>DB: UPDATE users SET deleted_at = NULL
    BE-->>Admin: 200 OK (User restored)
```

### Permission Resolution Flow

```mermaid
flowchart TD
    A[User Requests Protected Resource] --> B{Has Direct Permission?}
    B -->|Yes| G[Access Granted]
    B -->|No| C[Fetch User Roles]
    C --> D[Collect All Role Permissions]
    D --> E{Any Role Has Permission?}
    E -->|Yes| G
    E -->|No| F[Access Denied - 403]
```

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ roles_to_users : has
    users ||--o{ permissions_to_users : has
    roles ||--o{ roles_to_users : assigned
    roles ||--o{ permissions_to_roles : has
    permissions ||--o{ permissions_to_roles : assigned
    permissions ||--o{ permissions_to_users : assigned

    users {
        text id PK
        varchar name
        varchar username UK
        varchar email
        varchar phone_number
        text password
        boolean is_enable
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    roles {
        text id PK
        varchar code UK
        varchar name
        varchar description
        timestamp created_at
        timestamp updated_at
    }

    permissions {
        text id PK
        varchar code UK
        varchar description
        timestamp created_at
        timestamp updated_at
    }

    roles_to_users {
        text userId PK,FK
        text roleId PK,FK
    }

    permissions_to_users {
        text userId PK,FK
        text permissionId PK,FK
    }

    permissions_to_roles {
        text roleId PK,FK
        text permissionId PK,FK
    }
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ ROLES_TO_USERS : has
    USERS ||--o{ PERMISSIONS_TO_USERS : has
    USERS ||--o{ REFRESH_TOKENS : has
    ROLES ||--o{ ROLES_TO_USERS : assigned
    ROLES ||--o{ PERMISSIONS_TO_ROLES : has
    PERMISSIONS ||--o{ PERMISSIONS_TO_ROLES : assigned
    PERMISSIONS ||--o{ PERMISSIONS_TO_USERS : assigned

    USERS {
        text id PK
        varchar name
        varchar username UK
        varchar email
        varchar phone_number
        text password
        boolean is_enable
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    ROLES {
        text id PK
        varchar code UK
        varchar name
        timestamp created_at
        timestamp updated_at
    }

    PERMISSIONS {
        text id PK
        varchar code UK
        varchar description
        timestamp created_at
        timestamp updated_at
    }

    ROLES_TO_USERS {
        text userId PK,FK
        text roleId PK,FK
    }

    PERMISSIONS_TO_USERS {
        text userId PK,FK
        text permissionId PK,FK
    }

    PERMISSIONS_TO_ROLES {
        text roleId PK,FK
        text permissionId PK,FK
    }

    REFRESH_TOKENS {
        text id PK
        text user_id FK
        text token_hash
        timestamp expires_at
        timestamp revoked_at
    }
```

**Key Relationships:**
- `roles_to_users`: CASCADE on role delete, CASCADE on user delete
- `permissions_to_users`: No cascade (manual cleanup via cleanup functions)
- `refresh_tokens`: CASCADE on user delete (auto-logout on user removal)

---

## Important Notes

### Soft Delete System

**Default Behavior:**
- Users are soft-deleted by default (`DELETE /users/:id` with `skipTrash=false`)
- Soft-deleted users have `deletedAt` timestamp set
- Cascade effects on soft delete:
  - ✅ `refresh_tokens` physically deleted (CASCADE constraint)
  - ❌ `roles_to_users` remain intact (allows restoration with original roles)
  - ❌ `permissions_to_users` remain intact

**Permanent Delete:**
- Use `skipTrash=true` form parameter
- Physically removes user record
- Cascades to all related tables via database constraints

**Self-Delete Prevention:**
- Users cannot delete their own account
- Backend validates `userId !== currentUserId`
- Returns 400 error if attempted

### Super Admin Protection

**Hard-coded Protections:**
- Super Admin role (`code: "super-admin"`) cannot be deleted
- Backend query filters: `WHERE NOT (name = 'Super Admin')`
- Returns 404 if deletion attempted (role appears non-existent)
- Frontend displays "Superadmin" user with disabled delete button

**Why Protected:**
- System requires at least one Super Admin for administrative access
- Prevents lock-out scenarios where all admins are deleted

### Permission Resolution

**Computation:**
```typescript
// Backend: authInfo middleware
permissions = new Set([
  ...userDirectPermissions,
  ...roleBased Permissions (flattened from all roles)
]);
```

**Important Behaviors:**
- Permissions are **additive** (union, not intersection)
- Having role "A" + direct permission "X" = all role A permissions + permission X
- Removing a role doesn't affect direct permissions
- Permission changes take effect after next access token refresh (max 5 minutes)

**Query Efficiency:**
- Single query with nested joins loads user + roles + permissions
- Result cached in access token JWT (no DB lookup per request)

### Role Update Behavior

**Complete Replacement:**
- Updating user roles is **not additive** - it's a complete replacement
- Backend flow:
  1. DELETE all existing `roles_to_users` for user
  2. INSERT new `roles_to_users` from request
- Frontend must send full role array, not just changes

**Example:**
```typescript
// User currently has roles: ["role-1", "role-2"]
PATCH /users/:id { roles: ["role-3"] }
// Result: User now has ONLY ["role-3"]
```

### Username Uniqueness

**Constraint:**
- Database unique constraint on `users.username`
- Backend validation returns 422 with field-specific error:
```json
{
  "errorCode": "INVALID_FORM_DATA",
  "formErrors": { "username": "This username is already exists" }
}
```

**Frontend Handling:**
- React Hook Form maps `formErrors` to field-level validation
- Shows inline error message below username input
- Prevents form submission until resolved

### Notification System

**Trigger:**
- Creating a user sends notification to all users with `super-admin` role
- Uses `sendToRoles(["super-admin"], notification)` utility
- Non-blocking (notification failure doesn't fail user creation)

**Notification Content:**
```typescript
{
  title: "User Created",
  message: "User {name} has been created",
  type: "info"
}
```

### Frontend Data Table

**Features Implemented:**
- Server-side pagination (configurable per-page: 10/25/50/100)
- Multi-column sorting (client sends: `?sort=name:asc,createdAt:desc`)
- Advanced filtering with date ranges for `createdAt`
- Global search across name/username/email/ID
- Column visibility toggle
- State persistence in localStorage (`users-table` key)

**Sortable Columns:**
`name`, `username`, `email`, `isEnabled`, `createdAt`

**Filterable Columns:**
`name`, `isEnabled`, `roles` (multi-select), `createdAt` (date range)

**Performance:**
- Uses `placeholderData` to prevent loading flicker during pagination
- Query automatically refetches when params change
- Debounced search input (avoids excessive API calls)

### Password Handling

**Creation:**
- Minimum 6 characters validation
- Hashed with `Bun.password.hash()` before storage
- Never logged or sent in responses

**Update:**
- Password field optional in PATCH request
- Omitting password keeps existing hash unchanged
- Backend logic:
```typescript
...(userData.password ? { password: await hashPassword(userData.password) } : {})
```

### Edge Cases

**Restoring Non-Deleted User:**
- Returns 400: "The user is not deleted"
- Frontend should gray out/hide restore button for active users

**Deleting Non-Existent User:**
- Returns 404: "The user does not exists" (sic - typo in code)

**Empty Role Array:**
- Sending `roles: []` removes all role assignments
- User retains only direct permissions

**OAuth Users:**
- Can have `password: null` if created via OAuth only
- Cannot log in with username/password
- Still manageable through user management interface

### Testing Utilities

**Test User Creation:**
- `createUserForTesting()` utility pre-seeds permissions and roles
- Returns user object + valid access token for API testing
- Example:
```typescript
const testUser = await createUserForTesting({
  permissions: ["users.readAll", "users.create"]
});
// Use: testUser.accessToken, testUser.user.id
```

**Cleanup:**
- `cleanupTestUser(userId)` removes user + all associations
- Explicit cleanup in `afterAll()` hooks to prevent test pollution

---

## Revision History

| Version | Date | Summary of Change |
|---------|------|-------------------|
| 1 | 2025-12-22 | Initial documentation |
