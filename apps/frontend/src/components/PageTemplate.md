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

If `sortableColumns` is not provided, all accessor columns can be sorted by default. When provided, only the specified columns will have sorting functionality.

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
};

type FilterType = 'text' | 'checkbox' | 'date' | 'daterange' | 'select';
```

### Available Filter Types

1. **text** - Simple text input
2. **select** - Dropdown selection from predefined options
3. **checkbox** - Multiple checkbox selection from predefined options
4. **date** - Single date picker
5. **daterange** - Date range picker

## Example with Sorting and Filtering

```tsx
<PageTemplate
  title="Users"
  endpoint={client.users.$get}
  queryKey={["users"]}
  // Define which columns can be sorted
  sortableColumns={["name", "createdAt"]}
  // Define which columns can be filtered
  filterableColumns={[
    {
      id: "name",
      type: "text"
    },
    {
      id: "status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
      ]
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
    helper.accessor("name", {
      cell: (info) => info.getValue(),
      header: "Name" // The sortable button will be added automatically
    }),
    helper.accessor("status", {
      cell: (info) => info.getValue(),
      header: "Status"
    }),
    helper.accessor("createdAt", {
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      header: "Created At"
    })
  ]}
/>
```

## User Experience

- Users can click on column headers to sort by that column (if sortable)
- Users can click the "Filters" button to show/hide available filters
- Filters can be toggled on/off individually
- Multiple filters can be applied simultaneously
- Column widths can be adjusted by dragging the column edges (for resizable columns) 