# PageTemplate Component Documentation

The `PageTemplate` component provides a standardized way to create data table pages with sorting, filtering, pagination, and search functionality.

## Basic Usage

```tsx
import PageTemplate from "@/components/PageTemplate";
import client from "@/honoClient";

function MyPage() {
  return (
    <PageTemplate
      title="My Data"
      endpoint={client.myData.$get}
      queryKey={["myData"]}
      columnDefs={(helper) => [
        // Column definitions
      ]}
    />
  );
}
```

## Props

### Core Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | The title of the page |
| `endpoint` | `HonoEndpoint<T>` | Function that fetches paginated data |
| `columnDefs` | `(helper: ColumnHelper<T>) => ColumnDef<any, any>[]` | Function that defines table columns |
| `queryKey` | `any[]` | Optional cache key for React Query |

### Sorting Props

| Prop | Type | Description |
|------|------|-------------|
| `sortableColumns` | `Extract<keyof T, string>[]` | Array of column IDs that can be sorted |
| `serverSideSorting` | `boolean` | Whether sorting should be handled by the server |

When `serverSideSorting` is enabled, sorting parameters will be sent to the backend as a `sort` query parameter with a stringified JSON array of sorting criteria.

### Filtering Props

| Prop | Type | Description |
|------|------|-------------|
| `filterableColumns` | `FilterConfig<T>[]` | Array of filter configurations for columns |

### Table Appearance Props

| Prop | Type | Description |
|------|------|-------------|
| `columnBorders` | `boolean` | Whether to show vertical borders between columns |
| `nonResizableColumns` | `Extract<keyof T, string>[]` | Array of column IDs that cannot be resized |

By default, all columns are resizable. To prevent specific columns from being resizable, add them to the `nonResizableColumns` array.

## Filter Types

The `filterableColumns` prop accepts an array of `FilterConfig` objects with the following properties:

```ts
type FilterConfig<T> = {
  id: Extract<keyof T, string>;  // Column ID to filter
  type: FilterType;              // Type of filter to use
  options?: { label: string; value: unknown }[]; // Options for select/checkbox filters
  dateFormat?: string;           // Format for displaying dates
  serverSide?: boolean;          // Whether filtering should be handled by the server
};

type FilterType = 'text' | 'checkbox' | 'date' | 'daterange' | 'select';
```

### Available Filter Types

1. **text** - Simple text input
2. **select** - Dropdown selection from predefined options
3. **checkbox** - Multiple checkbox selection from predefined options
4. **date** - Single date picker
5. **daterange** - Date range picker

## Server-Side Sorting and Filtering

The PageTemplate component supports both client-side and server-side sorting and filtering with type-safe parameters.

### Server-Side Sorting

To enable server-side sorting:

```tsx
<PageTemplate
  // ...other props
  serverSideSorting={true}
  // ...
/>
```

When server-side sorting is enabled, the component will send a `sort` parameter to the backend with a strongly-typed array of sort criteria:

```ts
// SortingParam type definition
type SortingParam = {
  id: string;   // Column ID to sort by
  desc: boolean; // true for descending, false for ascending
};

// Example value
const sort = [
  { id: "name", desc: false },
  { id: "createdAt", desc: true }
];
```

### Server-Side Filtering

To enable server-side filtering for specific columns:

```tsx
<PageTemplate
  // ...other props
  filterableColumns={[
    {
      id: "status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
      ],
      serverSide: true  // This filter will be processed on the server
    }
  ]}
  // ...
/>
```

When a filter with `serverSide: true` is active, the component will send a `filter` parameter to the backend with a strongly-typed array of filter criteria:

```ts
// FilterParam type definition
type FilterParam = {
  id: string;    // Column ID to filter by
  value: unknown; // Filter value (type depends on the filter type)
};

// Example value
const filter = [
  { id: "status", value: "active" }
];
```

## Example with Server-Side Sorting and Filtering

```tsx
<PageTemplate
  title="Users"
  endpoint={client.users.$get}
  queryKey={["users"]}
  // Enable server-side sorting
  serverSideSorting={true}
  // Define which columns can be sorted
  sortableColumns={["name", "createdAt"]}
  // Define which columns can be filtered
  filterableColumns={[
    {
      id: "name",
      type: "text",
      serverSide: true
    },
    {
      id: "status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
      ],
      serverSide: true
    },
    {
      id: "createdAt",
      type: "daterange",
      dateFormat: "MMM dd, yyyy"
    }
  ]}
  // Enable column borders
  columnBorders={true}
  // Prevent resizing of these columns
  nonResizableColumns={["id", "actions"]}
  columnDefs={(helper) => [
    // Column definitions
  ]}
/>
```

## Backend Implementation

Your backend will receive strongly-typed query parameters:

- `page`: Current page number (string)
- `limit`: Number of items per page (string)
- `q`: Global search query (string or undefined)
- `sort`: Array of sorting parameters (or undefined)
- `filter`: Array of filter parameters (or undefined)

### Type Definitions

```typescript
// Recommended type definitions for the backend
export interface SortingParam {
  id: string;
  desc: boolean;
}

export interface FilterParam {
  id: string;
  value: unknown;
}

export interface PaginatedQueryParams {
  page: string;
  limit: string;
  q?: string;
  sort?: SortingParam[];
  filter?: FilterParam[];
}
```

### Example Hono Backend Handler with Drizzle ORM

```typescript
// Example Hono backend handler with Drizzle ORM
import { eq, like, gte, lte, and, desc, asc } from "drizzle-orm";
import { db } from "../drizzle";
import { users } from "../drizzle/schema/usersSchema";

app.get('/api/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const searchQuery = c.req.query('q');
  
  // Get sorting parameters (already properly typed)
  const sortParam = c.req.query('sort') as SortingParam[] | undefined;
  
  // Get filtering parameters (already properly typed)
  const filterParam = c.req.query('filter') as FilterParam[] | undefined;
  
  // Start with a base query
  let query = db.select();
  let countQuery = db.select({ count: sql`count(*)` });
  let whereConditions = [];
  
  // Apply global search if provided
  if (searchQuery) {
    whereConditions.push(like(users.name, `%${searchQuery}%`));
  }
  
  // Apply specific filters
  if (filterParam?.length) {
    filterParam.forEach(filter => {
      if (filter.id === 'status' && typeof filter.value === 'string') {
        whereConditions.push(eq(users.status, filter.value));
      } 
      else if (filter.id === 'name' && typeof filter.value === 'string') {
        whereConditions.push(like(users.name, `%${filter.value}%`));
      } 
      else if (filter.id === 'createdAt' && typeof filter.value === 'object') {
        const dateRange = filter.value as { from?: Date; to?: Date };
        if (dateRange.from) {
          whereConditions.push(gte(users.createdAt, dateRange.from));
        }
        if (dateRange.to) {
          whereConditions.push(lte(users.createdAt, dateRange.to));
        }
      }
    });
  }
  
  // Apply where conditions if any
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
    countQuery = countQuery.where(and(...whereConditions));
  }
  
  // Add from clause
  query = query.from(users);
  countQuery = countQuery.from(users);
  
  // Apply sorting
  if (sortParam?.length) {
    sortParam.forEach(sort => {
      // Map column ID to Drizzle column reference
      const column = users[sort.id as keyof typeof users];
      if (column) {
        query = query.orderBy(sort.desc ? desc(column) : asc(column));
      }
    });
  } else {
    // Default sorting
    query = query.orderBy(desc(users.createdAt));
  }
  
  // Apply pagination
  query = query.limit(limit).offset((page - 1) * limit);
  
  // Execute queries
  const [data, countResult] = await Promise.all([
    query,
    countQuery
  ]);
  
  const totalCount = countResult[0]?.count || 0;

  // Return paginated response
  return c.json({
    data,
    _metadata: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    }
  });
});
```

## User Experience

- Users can click on column headers to sort by that column (if sortable)
- Users can click the "Filters" button to show/hide available filters
- Filters can be toggled on/off individually
- Multiple filters can be applied simultaneously
- Column widths can be adjusted by dragging the column edges (for resizable columns)
- Server-side filters are visually distinguished with a label and subtle styling 