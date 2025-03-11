# Server-Side Sorting and Filtering Implementation Example

This example shows a complete implementation of server-side sorting and filtering for a users endpoint.

## Backend Route Implementation (Hono + Drizzle)

```typescript
// apps/backend/src/routes/usersRoute.ts
import { Hono } from "hono";
import { eq, like, gte, lte, and, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "../drizzle";
import { users, roles, userRoles } from "../drizzle/schema";
import { checkPermission } from "../utils/authUtils";

// Import the types from frontend
export interface SortingParam {
  id: string;
  desc: boolean;
}

export interface FilterParam {
  id: string;
  value: unknown;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

const app = new Hono();

// List users with server-side sorting and filtering
app.get("/", async (c) => {
  // Ensure user has permission
  const hasPermission = await checkPermission(c, "users:read");
  if (!hasPermission) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Get pagination parameters
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const searchQuery = c.req.query("q");
  
  // Get typed sorting parameters
  const sortParam = c.req.query("sort") as unknown as SortingParam[] | undefined;
  
  // Get typed filtering parameters
  const filterParam = c.req.query("filter") as unknown as FilterParam[] | undefined;
  
  // Base queries
  let query = db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      isEnabled: users.isEnabled,
      createdAt: users.createdAt,
      // Include roles as a subquery
      roles: sql<string>`(
        SELECT json_agg(json_build_object('id', r.id, 'name', r.name))
        FROM ${userRoles} ur
        JOIN ${roles} r ON ur.role_id = r.id
        WHERE ur.user_id = ${users.id}
      )`,
    });
    
  let countQuery = db.select({ count: sql`count(*)` });
  let whereConditions = [];
  
  // Apply global search if provided
  if (searchQuery) {
    whereConditions.push(
      sql`(${like(users.name, `%${searchQuery}%`)} OR 
           ${like(users.username, `%${searchQuery}%`)} OR 
           ${like(users.email, `%${searchQuery}%`)})`
    );
  }
  
  // Process specific filters
  if (filterParam?.length) {
    filterParam.forEach((filter) => {
      switch (filter.id) {
        case "isEnabled":
          if (typeof filter.value === "boolean") {
            whereConditions.push(eq(users.isEnabled, filter.value));
          }
          break;
          
        case "name":
          if (typeof filter.value === "string") {
            whereConditions.push(like(users.name, `%${filter.value}%`));
          }
          break;
          
        case "roles":
          if (Array.isArray(filter.value)) {
            const roleIds = filter.value as string[];
            // Complex subquery for role filtering
            whereConditions.push(
              sql`EXISTS (
                SELECT 1 FROM ${userRoles} 
                WHERE ${userRoles.userId} = ${users.id} 
                AND ${userRoles.roleId} IN (${inArray(roleIds)})
              )`
            );
          }
          break;
          
        case "createdAt":
          if (typeof filter.value === "object") {
            const dateRange = filter.value as DateRange;
            if (dateRange.from) {
              whereConditions.push(gte(users.createdAt, dateRange.from));
            }
            if (dateRange.to) {
              whereConditions.push(lte(users.createdAt, dateRange.to));
            }
          }
          break;
      }
    });
  }
  
  // Apply where conditions
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
    countQuery = countQuery.where(and(...whereConditions));
  }
  
  // Add from clause
  query = query.from(users);
  countQuery = countQuery.from(users);
  
  // Apply sorting
  if (sortParam?.length) {
    sortParam.forEach((sort) => {
      switch (sort.id) {
        case "name":
          query = query.orderBy(sort.desc ? desc(users.name) : asc(users.name));
          break;
        case "username":
          query = query.orderBy(sort.desc ? desc(users.username) : asc(users.username));
          break;
        case "email":
          query = query.orderBy(sort.desc ? desc(users.email) : asc(users.email));
          break;
        case "isEnabled":
          query = query.orderBy(sort.desc ? desc(users.isEnabled) : asc(users.isEnabled));
          break;
        case "createdAt":
          query = query.orderBy(sort.desc ? desc(users.createdAt) : asc(users.createdAt));
          break;
      }
    });
  } else {
    // Default sorting
    query = query.orderBy(desc(users.createdAt));
  }
  
  // Apply pagination
  query = query.limit(limit).offset((page - 1) * limit);
  
  try {
    // Execute queries
    const [data, countResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    const totalCount = Number(countResult[0]?.count || 0);
  
    // Return paginated response
    return c.json({
      data,
      _metadata: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
```

## Frontend Implementation

```tsx
// apps/frontend/src/routes/_dashboardLayout/users.lazy.tsx
import PageTemplate from "@/components/PageTemplate";
import { Badge } from "@repo/ui";
import client from "@/honoClient";
import { createLazyFileRoute } from "@tanstack/react-router";
import { TbEye, TbPencil, TbTrash } from "react-icons/tb";
import createActionButtons from "@/utils/createActionButton";

export const Route = createLazyFileRoute("/_dashboardLayout/users")({
  component: UsersPage,
});

export default function UsersPage() {
  return (
    <PageTemplate
      title="Users"
      endpoint={client.users.$get}
      queryKey={["users"]}
      // Enable server-side sorting
      serverSideSorting={true}
      // Define columns that can be sorted
      sortableColumns={["name", "username", "email", "isEnabled", "createdAt"]}
      // Define filterable columns with server-side processing
      filterableColumns={[
        {
          id: "name",
          type: "text",
          serverSide: true
        },
        {
          id: "isEnabled",
          type: "select",
          options: [
            { label: "Active", value: true },
            { label: "Inactive", value: false }
          ],
          serverSide: true
        },
        {
          id: "roles",
          type: "checkbox",
          options: [
            { label: "Admin", value: "1" },
            { label: "Editor", value: "2" },
            { label: "Viewer", value: "3" }
          ],
          serverSide: true
        },
        {
          id: "createdAt",
          type: "daterange",
          serverSide: true,
          dateFormat: "MMM dd, yyyy"
        }
      ]}
      // Enable column borders
      columnBorders={true}
      // Configure which columns cannot be resized
      nonResizableColumns={["actions"]}
      columnDefs={(helper) => [
        helper.display({
          header: "#",
          cell: (props) => props.row.index + 1,
          size: 50,
        }),
        helper.accessor("name", {
          cell: (info) => info.getValue(),
          header: "Name"
        }),
        helper.accessor("username", {
          cell: (info) => info.getValue(),
          header: "Username"
        }),
        helper.accessor("email", {
          cell: (info) => info.getValue(),
          header: "Email"
        }),
        helper.accessor("isEnabled", {
          cell: (info) => 
            info.getValue() ? (
              <Badge className="text-green-500 bg-green-100">
                Active
              </Badge>
            ) : (
              <Badge className="text-gray-500 bg-gray-100">
                Inactive
              </Badge>
            ),
          header: "Status"
        }),
        helper.accessor("roles", {
          cell: (info) => {
            const roles = info.row.original.roles || [];
            return roles.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {roles.slice(0, 3).map((role) => (
                  <span
                    key={role.id}
                    className="px-2 py-1 text-xs rounded bg-primary/10 text-primary"
                  >
                    {role.name}
                  </span>
                ))}
                {roles.length > 3 && (
                  <span className="px-2 py-1 text-xs rounded bg-gray-100">
                    +{roles.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">No roles</span>
            );
          },
          header: "Roles"
        }),
        helper.accessor("createdAt", {
          cell: (info) => {
            const date = info.getValue();
            return date 
              ? new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : '-';
          },
          header: "Created At"
        }),
        helper.display({
          id: "actions",
          header: "Actions",
          cell: (props) => (
            <div className="flex gap-2">
              {createActionButtons([
                {
                  label: "View",
                  permission: true,
                  action: `./detail/${props.row.original.id}`,
                  className: "bg-green-500 hover:bg-green-600",
                  icon: <TbEye />,
                },
                {
                  label: "Edit",
                  permission: true,
                  action: `./edit/${props.row.original.id}`,
                  className: "bg-yellow-500 hover:bg-yellow-600",
                  icon: <TbPencil />,
                },
                {
                  label: "Delete",
                  permission: true,
                  action: `./delete/${props.row.original.id}`,
                  variant: "outline",
                  className:
                    "border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
                  icon: <TbTrash />,
                },
              ])}
            </div>
          ),
        }),
      ]}
    />
  );
}
```

This example demonstrates a complete implementation of a table with server-side sorting and filtering, including proper typing throughout the entire stack. 