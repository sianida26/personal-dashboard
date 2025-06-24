# PRD: Table Template UX Improvements

## Overview

This PRD outlines the enhancement of the existing table template system to provide a more robust and intuitive user experience, inspired by Notion's sophisticated filtering and table interaction patterns. The current implementation provides basic filtering and sorting capabilities, but lacks the advanced filtering logic, visual feedback, and interaction patterns that make table management efficient and user-friendly.

## Objectives

1. **Advanced Filtering System**: Implement Notion-style multi-condition filtering with logical operators (AND/OR)
2. **Enhanced Filter Types**: Add support for more filter types beyond just select dropdowns
3. **Improved Visual Design**: Create a modern, clean interface with better visual hierarchy
4. **Better User Experience**: Provide intuitive interactions with immediate feedback
5. **Keyboard Navigation**: Add comprehensive keyboard shortcuts and navigation
6. **Performance Optimization**: Ensure smooth interactions even with large datasets
7. **Accessibility**: Implement WCAG compliant interactions and screen reader support

## Current State Analysis

### Existing Capabilities
- Basic column sorting with server-side support
- Simple select-based filtering system
- Column resizing functionality (manual only)
- Pagination with configurable page sizes
- Search functionality
- Filter chips with edit/remove capabilities
- Responsive design with column borders

### Current Pain Points (User Feedback)
1. **Filter Adoption**: Users avoid using filters due to poor UX
2. **Row Numbering Bug**: # column shows 1-n even on page 2+ (should show actual row numbers)
3. **Column Width**: Cannot set default column widths, only manual adjustment
4. **Scroll Position**: Page jumps to top when navigating pages
5. **Filter Discovery**: Users don't know which columns are filterable
6. **Limited Filter Types**: Only select dropdowns available
7. **Poor Visual Feedback**: Minimal cues for interactive elements
8. **Search Limitations**: Basic text search without field-specific options

## Scope

### In Scope
- Enhanced filtering system with multiple filter types and logical operators
- Improved visual design and interaction patterns
- Advanced search capabilities with field-specific search
- Column management improvements (hide/show, reorder)
- Filter presets and saved views
- Keyboard navigation and shortcuts
- Performance optimizations for large datasets
- Accessibility improvements
- Mobile-responsive design enhancements

### Out of Scope
- Complete architectural rewrite (maintain compatibility with existing PageTemplate)
- Real-time collaborative editing
- Data export functionality (separate feature)
- Advanced analytics or reporting features
- Third-party integrations

## Detailed Requirements

### 1. Enhanced Filtering System (Simplified)

#### Priority Filter Types  
Start with the most commonly needed filters:

```typescript
export type FilterType = 
  | "text"           // Contains, starts with, ends with (most requested)
  | "select"         // Existing - improve UX only
  | "date"           // Last 7 days, this month, between (high value)
  | "number"         // Greater than, less than, between
  | "boolean"        // Is true, is false, is empty
```

#### Essential Filter Operators
```typescript
export type FilterOperator = 
  | "equals"
  | "contains"          // For text searches
  | "starts_with"       // For name/code searches  
  | "greater_than"      // For numbers/dates
  | "less_than"         // For numbers/dates
  | "between"           // For ranges
  | "last_7_days"       // Quick date filter
  | "this_month"        // Quick date filter
  | "is_empty"          // For null checks
```

#### PostgreSQL Query Optimization
```typescript
class SmartQueryBuilder {
  // Use PostgreSQL-specific optimizations
  private buildOptimizedQuery(filters: FilterCondition[]) {
    // Use ILIKE for case-insensitive text search
    // Use proper date functions for date filters  
    // Use indexes hints for complex queries
    // Cache compiled queries for repeated patterns
  }
  
  // Auto-detect when to use client vs server filtering
  private shouldUseClientFiltering(dataSize: number) {
    return dataSize < 1000; // Client-side for small datasets
  }
}

### 2. Advanced Filter Interface

#### Notion-Style Filter Bar
- **Filter Pills**: Active filters displayed as editable pills with operator and value
- **Quick Actions**: Common filter operations accessible via dropdown
- **Visual Grouping**: Clear visual indication of AND/OR groupings
- **Drag & Drop**: Ability to reorder and group filters
- **One-Click Clear**: Easy way to clear all filters or specific groups

#### Enhanced Filter Creation
- **Column Detection**: Automatically suggest appropriate filter types based on column data
- **Smart Suggestions**: Show common filter values based on data distribution
- **Template Filters**: Pre-built filter templates for common use cases
- **Natural Language**: Allow text input like "created last week" or "status is pending"

### 3. Advanced Search Implementation

#### Global Search Enhancements
```typescript
export type SearchConfig = {
  enabled: boolean;
  placeholder?: string;
  searchableColumns?: string[]; // Limit search to specific columns
  searchMode: "contains" | "starts_with" | "fuzzy" | "exact";
  highlightResults?: boolean;
  debounceMs?: number;
};
```

#### Column-Specific Search
- **Quick Search**: Click column header to enable column-specific search
- **Search Syntax**: Support for advanced search syntax (`status:pending OR priority:high`)
- **Search History**: Remember recent searches per column
- **Auto-complete**: Suggest values based on existing data

### 4. Improved Column Management

#### Column Visibility
```typescript
export type ColumnVisibility = {
  [columnId: string]: {
    visible: boolean;
    order: number;
    width?: number;
    pinned?: "left" | "right" | false;
  };
};
```

#### Dynamic Column Operations
- **Hide/Show Columns**: Toggle column visibility with persistence
- **Column Reordering**: Drag and drop columns to reorder
- **Column Pinning**: Pin important columns to left or right
- **Column Grouping**: Group related columns together
- **Column Presets**: Save and load column configurations

### 5. Enhanced Visual Design

#### Design System Updates
```scss
// New design tokens for table interactions
:root {
  --table-filter-bg: hsl(210 40% 98%);
  --table-filter-border: hsl(210 40% 85%);
  --table-filter-active: hsl(210 100% 95%);
  --table-header-hover: hsl(210 40% 96%);
  --table-row-hover: hsl(210 40% 98%);
  --table-selection: hsl(210 100% 90%);
}
```

#### Interactive Elements
- **Hover States**: Clear visual feedback for all interactive elements
- **Loading States**: Skeleton loading for data updates
- **Empty States**: Helpful empty states with actionable suggestions
- **Progress Indicators**: Loading indicators for long-running operations
- **Micro-animations**: Subtle animations for state changes

### 6. Keyboard Navigation

#### Keyboard Shortcuts
```typescript
export const TABLE_SHORTCUTS = {
  // Navigation
  'ArrowUp/Down': 'Navigate rows',
  'ArrowLeft/Right': 'Navigate columns',
  'Home/End': 'Jump to first/last row',
  'PageUp/PageDown': 'Navigate pages',
  
  // Filtering
  'Cmd+F': 'Open global search',
  'Cmd+Shift+F': 'Open advanced filter',
  'Cmd+K': 'Open command palette',
  'Escape': 'Clear active filter/search',
  
  // Column Management
  'Cmd+H': 'Hide current column',
  'Cmd+Shift+H': 'Show all columns',
  'Cmd+R': 'Reset column layout',
  
  // Actions
  'Enter': 'Edit active cell/filter',
  'Space': 'Select/toggle row',
  'Cmd+A': 'Select all visible rows',
} as const;
```

#### Focus Management
- Clear focus indicators for keyboard navigation
- Logical tab order through interactive elements
- Focus trapping in modal dialogs
- Announcements for screen readers

### 7. Filter Presets and Saved Views

#### View Management
```typescript
export type SavedView = {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isPublic?: boolean; // For shared views
  createdBy: string;
  createdAt: Date;
  filters: FilterGroup[];
  sorting: SortingParam[];
  columnVisibility: ColumnVisibility;
  searchQuery?: string;
};
```

#### Features
- **Quick Filters**: One-click filters for common scenarios
- **Personal Views**: User-specific saved filter combinations
- **Shared Views**: Team-wide views for collaboration
- **View Switching**: Easy switching between different table views
- **View Management**: Create, edit, delete, and organize views

### 8. Performance Optimizations

#### Client-Side Optimizations
- **Virtual Scrolling**: For large datasets (>1000 rows)
- **Debounced Updates**: Prevent excessive API calls during filtering
- **Memoization**: Cache filter computations and column configurations
- **Progressive Loading**: Load data in chunks for better perceived performance

#### Server-Side Enhancements
```typescript
// Enhanced query parameters for complex filtering
export interface AdvancedQueryParams extends QueryParams {
  filters?: string; // JSON-encoded FilterGroup
  view?: string;    // Saved view ID
  columns?: string; // Visible column configuration
  search_columns?: string; // Columns to search in
}
```

### 9. Mobile Experience

#### Responsive Design
- **Collapsible Filters**: Stack filters vertically on mobile
- **Swipe Actions**: Swipe to access quick actions
- **Touch-Friendly**: Larger touch targets for mobile devices
- **Simplified Interface**: Hide advanced features on small screens

#### Mobile-Specific Features
- **Filter Drawer**: Full-screen filter interface on mobile
- **Column Carousel**: Horizontal scrolling for columns
- **Gesture Support**: Pinch to zoom, swipe to navigate
- **Offline Support**: Basic caching for offline viewing

### 10. Accessibility Features

#### WCAG Compliance
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **High Contrast**: Support for high contrast themes
- **Focus Management**: Clear focus indicators and logical tab order
- **Keyboard Navigation**: Full keyboard accessibility
- **Voice Announcements**: Live regions for dynamic updates

#### Accessibility Enhancements
```typescript
export type AccessibilityConfig = {
  announceFilterChanges: boolean;
  announceDataUpdates: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  keyboardNavigationMode: boolean;
};
```

## Implementation Plan - Prioritized by Impact vs Effort

### Phase 1: Quick Wins (Week 1) 🚀
**High Impact + Easy Implementation**

- [ ] **Fix Row Numbering Bug**: Correct # column to show actual row numbers across pages
- [ ] **Fix Scroll Position**: Maintain scroll position when navigating pages  
- [ ] **Default Column Widths**: Allow setting initial column widths in configuration
- [ ] **Visual Filter Indicators**: Show filter icons on filterable columns
- [ ] **Better Loading States**: Add skeleton loading for smoother transitions

```typescript
// Quick fixes for immediate pain points
interface ColumnConfig {
  defaultWidth?: number;        // Set initial column width
  minWidth?: number;           // Minimum width constraint
  maxWidth?: number;           // Maximum width constraint
}

// Fix row numbering calculation
const getRowNumber = (rowIndex: number, currentPage: number, pageSize: number) => {
  return (currentPage - 1) * pageSize + rowIndex + 1;
};
```

### Phase 2: UX Improvements (Week 2) ✨  
**Medium Impact + Easy Implementation**

- [ ] **Enhanced Filter Pills**: Better visual design for filter chips
- [ ] **Smart Filter Suggestions**: Show popular filter values in dropdowns
- [ ] **Quick Filter Presets**: Add common filters like "Recent", "Mine", "Active"
- [ ] **Better Empty States**: Helpful messages when no data or filters applied
- [ ] **Improved Search UX**: Better search input with clear button and suggestions

### Phase 3: New Filter Types (Week 3-4) 🎯
**High Impact + Medium Effort**

- [ ] **Text Filters**: Add "contains", "starts with", "ends with" operators
- [ ] **Date Filters**: Add "last 7 days", "this month", "between dates" options  
- [ ] **Number Filters**: Add "greater than", "less than", "between" operators
- [ ] **Dynamic Query Builder**: PostgreSQL-optimized query generation

```typescript
// PostgreSQL-optimized query builder
class PostgreSQLQueryBuilder {
  buildTextFilter(column: string, operator: string, value: string) {
    switch (operator) {
      case 'contains': return `${column} ILIKE '%${value}%'`;
      case 'starts_with': return `${column} ILIKE '${value}%'`;
      case 'ends_with': return `${column} ILIKE '%${value}'`;
    }
  }
  
  buildDateFilter(column: string, operator: string, value: any) {
    switch (operator) {
      case 'last_7_days': return `${column} >= NOW() - INTERVAL '7 days'`;
      case 'this_month': return `${column} >= DATE_TRUNC('month', NOW())`;
      case 'between': return `${column} BETWEEN '${value.start}' AND '${value.end}'`;
    }
  }
}
```

### Phase 4: Advanced Features (Week 5-6) 🔥
**Medium Impact + Medium Effort**

- [ ] **Column Management**: Hide/show columns with persistence
- [ ] **Saved Views**: Save and restore filter/column configurations  
- [ ] **Advanced Search**: Field-specific search with syntax support
- [ ] **Performance Optimization**: Virtual scrolling for large datasets
- [ ] **Mobile Improvements**: Better responsive design

## Task-Based Component Architecture

### Immediate Bug Fixes (LLM-Friendly Tasks)

#### Task 1: Fix Row Numbering Component
```typescript
// File: components/table/RowNumberCell.tsx
export interface RowNumberCellProps {
  rowIndex: number;
  currentPage: number;
  pageSize: number;
}

export const RowNumberCell = ({ rowIndex, currentPage, pageSize }: RowNumberCellProps) => {
  const actualRowNumber = (currentPage - 1) * pageSize + rowIndex + 1;
  return <span className="font-mono text-sm text-muted-foreground">{actualRowNumber}</span>;
};
```

#### Task 2: Fix Scroll Position Hook
```typescript
// File: hooks/useScrollPosition.ts
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const saveScrollPosition = () => {
    setScrollPosition(window.scrollY);
  };
  
  const restoreScrollPosition = () => {
    window.scrollTo(0, scrollPosition);
  };
  
  return { saveScrollPosition, restoreScrollPosition };
};
```

#### Task 3: Column Width Configuration
```typescript
// File: types/table.ts
export interface ColumnConfig {
  id: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
}

// Update PageTemplate props
export interface EnhancedPageTemplateProps<T> extends Props<T> {
  columnWidths?: Record<string, ColumnConfig>;
  preserveScrollPosition?: boolean; // Default: true
}
```

### Enhanced Filtering Components (Progressive Tasks)

#### Task 4: Text Filter Component  
```typescript
// File: components/filters/TextFilter.tsx
export interface TextFilterProps {
  columnId: string;
  value: string;
  operator: 'contains' | 'starts_with' | 'ends_with' | 'equals';
  onChange: (value: string, operator: string) => void;
  suggestions?: string[]; // Auto-complete from existing data
}
```

#### Task 5: Date Filter Component
```typescript  
// File: components/filters/DateFilter.tsx
export interface DateFilterProps {
  columnId: string;
  value: DateFilterValue;
  operator: 'last_7_days' | 'this_month' | 'between' | 'equals';
  onChange: (value: DateFilterValue, operator: string) => void;
}

type DateFilterValue = {
  single?: Date;
  range?: { start: Date; end: Date };
  preset?: 'last_7_days' | 'this_month' | 'this_year';
};
```

#### Task 6: PostgreSQL Query Builder
```typescript
// File: utils/queryBuilder.ts  
export class PostgreSQLFilterBuilder {
  static buildTextFilter(column: string, operator: string, value: string): string {
    const escapedValue = value.replace(/'/g, "''"); // Prevent SQL injection
    
    switch (operator) {
      case 'contains':
        return `${column} ILIKE '%${escapedValue}%'`;
      case 'starts_with':
        return `${column} ILIKE '${escapedValue}%'`;
      case 'ends_with':
        return `${column} ILIKE '%${escapedValue}'`;
      case 'equals':
        return `${column} ILIKE '${escapedValue}'`;
      default:
        throw new Error(`Unsupported text operator: ${operator}`);
    }
  }
  
  static buildDateFilter(column: string, operator: string, value: any): string {
    switch (operator) {
      case 'last_7_days':
        return `${column} >= NOW() - INTERVAL '7 days'`;
      case 'this_month':
        return `${column} >= DATE_TRUNC('month', NOW()) AND ${column} < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'`;
      case 'between':
        return `${column} BETWEEN '${value.start}' AND '${value.end}'`;
      default:
        throw new Error(`Unsupported date operator: ${operator}`);
    }
  }
}

## User Experience Flows

### 1. Creating a Complex Filter
1. User clicks "Add Filter" button
2. System shows column selector with search
3. User selects column, system suggests appropriate filter type
4. User configures filter condition with intuitive interface
5. User can add multiple conditions with AND/OR logic
6. Real-time preview shows affected row count
7. User applies filter with visual confirmation

### 2. Managing Saved Views
1. User creates custom filter and column configuration
2. User clicks "Save View" and provides name/description
3. View appears in quick access toolbar
4. User can switch between views with single click
5. User can share views with team members
6. Views persist across sessions

### 3. Advanced Search Workflow
1. User starts typing in global search
2. System provides auto-complete suggestions
3. User can use advanced syntax for specific fields
4. Search highlights matching content in results
5. User can quickly convert search to filters
6. Search history available for quick access

## Success Metrics

### User Experience Metrics
- **Filter Adoption Rate**: % of users who use filters (target: 60%+)
- **Time to Filter**: Average time to create first filter (target: <30 seconds)
- **View Usage**: % of users who create saved views (target: 40%+)
- **Task Completion**: % of users who successfully complete complex filtering tasks (target: 85%+)

### Performance Metrics
- **Filter Response Time**: Time to apply filters (target: <500ms)
- **Search Response Time**: Time to return search results (target: <200ms)
- **Page Load Time**: Initial table load time (target: <2 seconds)
- **Memory Usage**: Client-side memory consumption (target: <50MB for large tables)

### Accessibility Metrics
- **Screen Reader Compatibility**: All features accessible via screen reader
- **Keyboard Navigation**: 100% keyboard accessible
- **WCAG Compliance**: Level AA compliance achieved
- **Color Contrast**: 4.5:1 minimum contrast ratio

## Risk Mitigation

### Technical Risks
1. **Performance Impact**: Large filter sets may slow down the interface
   - **Mitigation**: Implement virtual scrolling and query optimization
   
2. **Complex State Management**: Advanced filtering requires complex state handling
   - **Mitigation**: Use proven state management patterns and comprehensive testing
   
3. **Backend Compatibility**: Existing APIs may not support complex queries
   - **Mitigation**: Gradual API enhancement with backward compatibility

### User Experience Risks
1. **Feature Complexity**: Advanced features may overwhelm users
   - **Mitigation**: Progressive disclosure and good default settings
   
2. **Learning Curve**: New interface patterns may confuse existing users
   - **Mitigation**: Gradual rollout with user education and onboarding

### Implementation Risks
1. **Breaking Changes**: Enhancements may break existing table implementations
   - **Mitigation**: Maintain backward compatibility and provide migration guides
   
2. **Cross-Browser Issues**: Complex interactions may not work consistently
   - **Mitigation**: Comprehensive browser testing and graceful degradation

## Testing Strategy

### Unit Testing
- Component-level testing for all new filter components
- Hook testing for filter logic and state management
- Utility function testing for search and filter algorithms

### Integration Testing
- End-to-end filter creation and application workflows
- Cross-component interaction testing
- API integration testing for complex queries

### User Testing
- Usability testing with actual users
- A/B testing for different interface approaches
- Accessibility testing with assistive technologies

### Performance Testing
- Load testing with large datasets
- Memory leak testing for long-running sessions
- Mobile performance testing across devices

## Future Enhancements

### Advanced Analytics
- Filter usage analytics to improve UX
- Performance monitoring and optimization
- User behavior analysis for further improvements

### AI-Powered Features
- Smart filter suggestions based on user behavior
- Natural language query processing
- Automated view recommendations

### Collaboration Features
- Real-time collaborative filtering
- Comment system for saved views
- Activity feed for view changes

### Advanced Data Visualization
- Filter result visualization (charts, graphs)
- Data distribution previews
- Filter impact analysis

---

This PRD provides a comprehensive roadmap for transforming the current basic table template into a sophisticated, Notion-inspired data management interface that will significantly improve user productivity and satisfaction while maintaining the robust foundation already established.
