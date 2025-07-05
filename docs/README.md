# Documentation References:
- [Version System](docs/VERSION_SYSTEM.md)
- [Backend](docs/backend/README.md)
- [Frontend](docs/frontend/README.md)

## Feature Documentation Structure

Each application feature has its own dedicated documentation folder organized as follows:

```
docs/
├── features/
│   ├── <feature-name>/
│   │   ├── README.md      # Feature overview and implementation details
│   │   ├── flowchart.md   # Process flow diagrams and workflows
│   │   └── ...            # Additional feature-specific documentation
│   └── <another-feature>/
│       ├── README.md      # Feature overview and implementation details
│       └── flowchart.md   # Process flow diagrams and workflows
```

### Feature Documentation Guidelines

- **Feature Overview**: Each feature's `README.md` should include:
  - Purpose and functionality description
  - API endpoints (for backend features)
  - Component usage (for frontend features)
  - Configuration options
  - Usage examples
  - **Data model references** (not definitions) - link to the authoritative source
  - **Enum references** (not definitions) - link to the authoritative source

- **Flowcharts**: Each feature's `flowchart.md` should contain:
  - Process flow diagrams using Mermaid syntax
  - User interaction workflows
  - Data flow between components
  - Error handling flows

### Data Model and Enum Guidelines

- **Single Source of Truth**: Data models and enums should be defined in one authoritative location
- **Reference, Don't Duplicate**: Other documentation should reference these definitions, not redefine them
- **Authoritative Sources**:
  - Backend data models: `docs/backend/data-models.md`
  - Frontend type definitions: `docs/frontend/types.md`
  - Feature-specific models: `docs/features/<feature-name>/data-models.md`
  - Shared enums: `docs/shared/enums.md`

### Cross-Reference Format

When referencing data models or enums in feature documentation:

```markdown
## Data Models

This feature uses the following data models:

- **User Model**: See [Backend Data Models](../../backend/data-models.md#user-model)
- **Role Model**: See [Role Management](../role-management/data-models.md#role-model)
- **Status Enum**: See [Shared Enums](../../shared/enums.md#status-enum)
```

### Example Feature Documentation

```
docs/
├── features/
│   ├── authentication/
│   │   ├── README.md      # Auth implementation details
│   │   └── flowchart.md   # Login/logout flow diagrams
│   ├── dashboard/
│   │   ├── README.md      # Dashboard components and APIs
│   │   └── flowchart.md   # Dashboard data flow
│   └── user-management/
│       ├── README.md      # User CRUD operations
│       └── flowchart.md   # User lifecycle workflows
```

# Project Documentation:
