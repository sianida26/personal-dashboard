# AdaptiveTable Component

Advanced, feature-rich table component with row virtualization for optimal performance with large datasets.

## Quick Start

```tsx
import { AdaptiveTable, type AdaptiveColumnDef } from '@/components/AdaptiveTable';

const columns: AdaptiveColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];

<AdaptiveTable
  columns={columns}
  data={users}
  title="Users"
/>
```

## Custom Labels

You can customize the labels used in the table settings menu:

```tsx
<AdaptiveTable
  columns={columns}
  data={users}
  labels={{
    columnVisibility: "Show/Hide Columns",
    sort: "Order By",
    groupBy: "Categorize",
  }}
/>
```

## Key Features

### 🚀 Performance
- **Row Virtualization** (enabled by default): Smoothly handle 10,000+ rows
- Only renders visible rows in viewport
- Automatic optimization for large datasets

### 📊 Column Operations
- **Drag & Drop Reordering**: Rearrange columns visually
- **Resizable Columns**: Adjust column widths
- **Show/Hide Columns**: Toggle column visibility
- **Sticky Header**: Header stays visible while scrolling

### 🔧 Data Operations
- **Sorting**: Single and multi-column sorting
- **Grouping**: Group rows by column values
- **Pagination**: Client-side and server-side modes
- **Row Selection**: Single or bulk row selection
- **Filtering**: Built-in filter support

### ✏️ Editing
- **Inline Editing**: Edit cells directly in table
- **Text Input**: Simple text editing
- **Select Options**: Dropdown selection with custom styling

### 💾 State Management
- **Persistence**: Save table state to localStorage
- **Auto-restore**: Restore user preferences on load

### 🎨 UI/UX
- **Loading States**: Skeleton loaders during data fetch
- **Detail View**: Expandable row details
- **Responsive**: Full-width with proper scrolling
- **Custom Actions**: Header and row-level actions

## Row Virtualization

### Overview
Row virtualization is **enabled by default** for optimal performance. It renders only the visible rows in the viewport plus a small buffer (overscan).

### Benefits
- ✅ Handle datasets with 10,000+ rows smoothly
- ✅ Reduced memory footprint
- ✅ Faster initial render
- ✅ Smooth scrolling experience

### Usage

```tsx
// Default (virtualization enabled)
<AdaptiveTable
  columns={columns}
  data={largeDataset}
  tableHeight="600px" // Container height
/>

// Custom height for your layout
<AdaptiveTable
  columns={columns}
  data={data}
  tableHeight="calc(100vh - 200px)" // Responsive height
/>

// Disable if needed
<AdaptiveTable
  columns={columns}
  data={smallDataset}
  rowVirtualization={false}
/>
```

### Important Notes

1. **Fixed Height Required**: When virtualization is enabled, the table container has a fixed height (default: 600px)
2. **Auto-disabled for Grouping**: Virtualization automatically turns off when data is grouped
3. **Scrolling**: Table scrolls within its container, not the page
4. **Full Width**: Table content is not overflowed by default

### Performance Tips

- Set appropriate `tableHeight` based on your layout
- Use server-side pagination for datasets > 100,000 rows
- Consider disabling other features (resizing, reordering) if not needed

## Props

### Core Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `AdaptiveColumnDef<T>[]` | Required | Column definitions |
| `data` | `T[]` | Required | Table data |

### Virtualization Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rowVirtualization` | `boolean` | `true` | Enable row virtualization |
| `tableHeight` | `string` | `"600px"` | Height of table container |

### Feature Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columnOrderable` | `boolean` | `false` | Enable drag-and-drop column reordering |
| `columnResizable` | `boolean` | `false` | Enable column resizing |
| `columnVisibilityToggle` | `boolean` | `true` | Enable show/hide columns |
| `groupable` | `boolean` | `true` | Enable grouping by column |
| `sortable` | `boolean` | `true` | Enable sorting |
| `pagination` | `boolean` | `false` | Enable pagination |
| `paginationType` | `"client" \| "server"` | `"client"` | Pagination mode |
| `rowSelectable` | `boolean` | `false` | Enable row selection |
| `showHeader` | `boolean` | `true` | Show table header |
| `showDetail` | `boolean` | `true` | Show detail view button |
| `loading` | `boolean` | `false` | Show loading skeleton |
| `saveState` | `string` | `undefined` | LocalStorage key for state persistence |

### Display Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Table title |
| `headerActions` | `ReactNode` | `undefined` | Custom header actions |
| `labels` | `Partial<TableSettingsLabels>` | `undefined` | Custom labels for table settings menu |

### TableSettingsLabels
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `columnVisibility` | `string` | `"Column Visibility"` | Label for column visibility menu |
| `propertyVisibility` | `string` | `"Property visibility"` | Header for visibility settings |
| `shownInTable` | `string` | `"Shown in table"` | Label for visible columns section |
| `hidden` | `string` | `"Hidden"` | Label for hidden columns section |
| `groupBy` | `string` | `"Group By"` | Label for group by menu |
| `groupByProperty` | `string` | `"Group by property"` | Header for group by settings |
| `sort` | `string` | `"Sort"` | Label for sort menu |
| `moreOptions` | `string` | `"More Options"` | Label for additional options menu |

### Pagination Props (when `pagination={true}`)
| Prop | Type | Description |
|------|------|-------------|
| `currentPage` | `number` | Current page (server-side) |
| `maxPage` | `number` | Total pages (server-side) |
| `recordsTotal` | `number` | Total record count |
| `onPaginationChange` | `(perPage: number, page: number) => void` | Page change handler |

### Selection Props (when `rowSelectable={true}`)
| Prop | Type | Description |
|------|------|-------------|
| `selectActions` | `Array<{ name: string; button: ReactNode }>` | Bulk action buttons |
| `onSelect` | `(row: T) => void` | Single row select handler |
| `onSelectAction` | `(rows: T[], actionName: string) => void` | Bulk action handler |

### Callback Props
| Prop | Type | Description |
|------|------|-------------|
| `onSortingChange` | `(sorting: SortingState) => void` | Sort change handler |
| `onDetailClick` | `(row: T, rowIndex: number) => void` | Custom detail handler |

## Column Definition

```typescript
type AdaptiveColumnDef<T> = ColumnDef<T> & {
  // TanStack Table standard props
  accessorKey?: string;
  header?: string | ((props) => ReactNode);
  cell?: (props) => ReactNode;
  size?: number;
  
  // Editing
  editable?: boolean;
  editType?: "text" | "select";
  options?: Array<{ 
    label: string; 
    value: string | number; 
    color?: string 
  }>;
  onEdited?: (rowIndex: number, columnId: string, value: unknown) => void;
  
  // Styling
  cellClassName?: string;
  getCellColor?: (value: unknown) => string | undefined;
  
  // Column-level overrides
  orderable?: boolean;
  resizable?: boolean;
  visibilityToggle?: boolean;
  sortable?: boolean;
  settingsLabel?: string; // Custom label for table settings menu (defaults to header)
};
```

## Examples

### Basic Table with Virtualization
```tsx
<AdaptiveTable
  columns={columns}
  data={largeDataset}
  title="Users"
  tableHeight="calc(100vh - 200px)"
/>
```

### Editable Table
```tsx
const columns: AdaptiveColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    editable: true,
    editType: "text",
    onEdited: (rowIndex, columnId, value) => {
      console.log('Edit:', { rowIndex, columnId, value });
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    editable: true,
    editType: "select",
    options: [
      { label: "Active", value: "active", color: "#22c55e" },
      { label: "Inactive", value: "inactive", color: "#ef4444" },
    ],
    settingsLabel: "User Status", // Custom label for settings menu
  },
];
];
```

### Server-side Pagination
```tsx
<AdaptiveTable
  columns={columns}
  data={data}
  pagination={true}
  paginationType="server"
  currentPage={page}
  maxPage={totalPages}
  recordsTotal={totalRecords}
  loading={isLoading}
  onPaginationChange={(perPage, currentPage) => {
    fetchData({ perPage, page: currentPage });
  }}
/>
```

### With Row Selection & Bulk Actions
```tsx
<AdaptiveTable
  columns={columns}
  data={data}
  rowSelectable={true}
  selectActions={[
    { 
      name: "delete", 
      button: <Button color="red">Delete Selected</Button> 
    },
    { 
      name: "export", 
      button: <Button>Export Selected</Button> 
    },
  ]}
  onSelectAction={(selectedRows, actionName) => {
    if (actionName === "delete") {
      handleBulkDelete(selectedRows);
    }
  }}
/>
```

### Full-Featured Table
```tsx
<AdaptiveTable
  // Data
  columns={columns}
  data={data}
  
  // Virtualization
  rowVirtualization={true}
  tableHeight="calc(100vh - 200px)"
  
  // Features
  columnOrderable={true}
  columnResizable={true}
  sortable={true}
  pagination={true}
  paginationType="server"
  rowSelectable={true}
  
  // Display
  title="User Management"
  loading={isLoading}
  showDetail={true}
  
  // State persistence
  saveState="user-management-table"
  
  // Header actions
  headerActions={
    <Button onClick={handleCreate}>Create User</Button>
  }
  
  // Pagination
  currentPage={page}
  maxPage={totalPages}
  recordsTotal={totalRecords}
  onPaginationChange={handlePageChange}
  
  // Selection
  selectActions={bulkActions}
  onSelectAction={handleBulkAction}
  
  // Callbacks
  onSortingChange={handleSortChange}
  onDetailClick={handleDetailView}
/>
```

## Migration from Previous Version

If you're upgrading from a version without virtualization:

1. **No changes required** - Virtualization is enabled by default
2. **Adjust height** - Set `tableHeight` if default (600px) doesn't fit your layout
3. **Review grouping** - Virtualization auto-disables when grouped
4. **Test performance** - Should see improved performance with large datasets

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support (touch scrolling)

## Dependencies

- `@tanstack/react-table` - Table logic
- `@tanstack/react-virtual` - Row virtualization
- `@dnd-kit/core` - Drag and drop (column reordering)

## Related Documentation

- [Frontend Component Patterns](../../../docs/frontend/component-patterns.md)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)
