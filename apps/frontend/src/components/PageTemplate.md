# PageTemplate Component Documentation

The `PageTemplate` component provides a standardized way to create data table pages with sorting, filtering, pagination, and search functionality.

## Basic Usage

```tsx
import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";

function MyPage() {
  return createPageTemplate({
    title: "My Data",
    endpoint: client.myData.$get,
    queryKey: ["myData"],
    columnDefs: (helper) => [
      // Column definitions
    ]
  });
}
```

## Props

### Core Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | The title of the page |
| `endpoint` | `HonoEndpoint<T>` | Function that fetches paginated data |
| `columnDefs` | `(helper: ColumnHelper<T>) => ColumnDef<T, unknown>[]` | Function that defines table columns |
| `queryKey` | `unknown[]` | Optional cache key for React Query |
| `searchBar` | `boolean` | Whether to show search bar (defaults to true) |
| `createButton` | `boolean \| string \| ReactNode` | Configuration for create button |
| `modals` | `(ReactNode \| LazyExoticComponent<React.ComponentType>)[]` | Optional modals to render. Supports both regular React nodes and lazy-loaded components |
| `topContent` | `ReactNode` | Optional content to be rendered on the left side of create button |

### Sorting Props

| Prop | Type | Description |
|------|------|-------------|
| `sortableColumns` | `Extract<keyof T, string>[]` | Array of column IDs that can be sorted |

All sorting is handled by the server. When sorting is applied, it will be sent to the backend as a `sort` query parameter with a stringified JSON array of sorting criteria.

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
  label: string;                 // Display label for the filter
  type: FilterType;              // Type of filter to use
  options: { label: string; value: string }[]; // Options for select filters
};

type FilterType = 'select';  // Currently only select type is supported
```

## Server-Side Sorting and Filtering

The PageTemplate component handles all sorting and filtering on the server side.

### Sorting Parameters

When sorting is applied, the component sends a `sort` parameter to the backend:

```ts
// SortingParam type definition
type SortingParam = {
  id: string;   // Column ID to sort by
  desc: boolean; // true for descending, false for ascending
};
```

### Filtering Parameters

When filters are applied, the component sends a `filter` parameter to the backend:

```ts
// FilterParam type definition
type FilterParam = {
  id: string;    // Column ID to filter by
  value: string; // Filter value
};
```

## Example Usage

```tsx
import { createPageTemplate } from "@/components/PageTemplate";
import client from "@/honoClient";

function UsersPage() {
  return createPageTemplate({
    title: "Users",
    endpoint: client.users.$get,
    queryKey: ["users"],
    createButton: "Create User",
    sortableColumns: ["name", "username"],
    filterableColumns: [
      {
        id: "status",
        type: "select",
        label: "Status",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" }
        ]
      }
    ],
    columnBorders: true,
    columnDefs: (helper) => [
      helper.accessor("name", {
        header: "Name",
        cell: (info) => info.getValue()
      }),
      helper.accessor("status", {
        header: "Status",
        cell: (info) => info.getValue()
      })
    ]
  });
}
```

## Backend Implementation

Your backend will receive the following query parameters:

```typescript
export interface QueryParams {
  page: string;
  limit: string;
  q?: string;
  sort?: string;    // Stringified JSON array of SortingParam
  filter?: string;  // Stringified JSON array of FilterParam
}

// The backend should return a PaginatedResponse:
export interface PaginatedResponse<T> {
  data: T[];
  _metadata: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
```

## User Experience Features

- Search bar for global text search (can be disabled)
- Column sorting by clicking headers (for sortable columns)
- Filter button to show/hide available filters
- Active filters displayed as chips with edit/remove functionality
- Column width adjustment by dragging edges (for resizable columns)
- Pagination controls
- Optional create button with customizable text/component
- Support for custom modals 

## Modal Support

The `modals` prop accepts an array of either React nodes or lazy-loaded components. This allows for both immediate rendering and code-splitting of modal components:

```tsx
import { lazy } from 'react';

// Regular modal
const RegularModal = () => <div>Regular Modal</div>;

// Lazy-loaded modal
const LazyModal = lazy(() => import('./LazyModal'));

function MyPage() {
  return createPageTemplate({
    // ... other props
    modals: [
      <RegularModal key="regular" />, // Regular React node
      LazyModal // Lazy-loaded component
    ]
  });
}
```

When using lazy-loaded modals, they will be automatically wrapped in a Suspense boundary with a null fallback. 