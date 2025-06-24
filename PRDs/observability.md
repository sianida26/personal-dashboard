# PRD: Minimal Observability System

## Overview

This PRD outlines the implementation of a minimal observability system for the dashboard template application. The system will provide essential monitoring capabilities for API endpoints and frontend events while maintaining simplicity and performance.

## Objectives

1. **API Monitoring**: Track endpoint performance, response codes, and request patterns
2. **Frontend Observability**: Monitor frontend errors, performance metrics, and user interactions
3. **Request Tracing**: Store detailed request/response data for debugging
4. **Control Mechanisms**: Implement toggles for observability recording
5. **Dashboard Interface**: Provide a `/observability` page for viewing metrics and logs

## Scope

### In Scope
- API endpoint performance tracking (response times, status codes, error rates)
- Frontend error monitoring and performance metrics
- Request/response logging with user context
- Stack trace capture for errors
- Observability dashboard UI
- Global and route-specific recording controls
- Data masking controls for sensitive information
- Minimal storage requirements (30-day retention by default)

### Out of Scope
- Real-time alerting
- Complex analytics or reporting
- Third-party integrations (APM tools)
- Distributed tracing across multiple services
- Log aggregation beyond the current application

## System Architecture

### Backend Components

#### 1. Database Schema

**Observability Events Table** (`observability_events`)
```sql
- id: varchar(25) PRIMARY KEY (CUID2)
- event_type: varchar(50) NOT NULL -- 'api_request', 'frontend_error', 'frontend_metric'
- timestamp: timestamp NOT NULL
- user_id: varchar(25) REFERENCES users(id) -- nullable for anonymous requests
- request_id: varchar(25) -- correlation with existing request logs
- endpoint: varchar(255) -- API endpoint or frontend route
- method: varchar(10) -- HTTP method for API requests
- status_code: integer -- HTTP status code
- response_time_ms: integer -- response time in milliseconds
- error_message: text -- error message if applicable
- stack_trace: text -- full stack trace for errors
- metadata: jsonb -- flexible storage for additional context
- created_at: timestamp DEFAULT now()
```

**Request Details Table** (`request_details`)
```sql
- id: varchar(25) PRIMARY KEY (CUID2)
- request_id: varchar(25) UNIQUE NOT NULL
- user_id: varchar(25) REFERENCES users(id) -- nullable
- method: varchar(10) NOT NULL
- endpoint: varchar(255) NOT NULL
- query_params: jsonb
- request_body: jsonb
- response_body: jsonb
- headers: jsonb -- selected headers only
- ip_address: varchar(45)
- user_agent: text
- created_at: timestamp DEFAULT now()
```

#### 2. Middleware Enhancement

**Enhanced Request Logger Middleware**
- Capture detailed request/response data with configurable masking
- Store observability events
- Respect recording toggles
- Configurable data masking for sensitive information (passwords, tokens, etc.)

**New Observability Middleware**
- Calculate and store performance metrics
- Capture all error details with complete stack traces
- Filter observability-related routes when configured
- Handle data anonymization based on configuration

#### 3. Environment Configuration

**New Environment Variables**
```env
# Observability Controls
OBSERVABILITY_ENABLED=true
OBSERVABILITY_RECORD_SELF=false  # Record observability route calls
OBSERVABILITY_RETENTION_DAYS=30
OBSERVABILITY_MAX_BODY_SIZE=10240  # Max request/response body size to store (bytes)

# Data Privacy Controls
OBSERVABILITY_MASK_SENSITIVE_DATA=true  # Mask passwords, tokens, etc.
OBSERVABILITY_ANONYMIZE_USERS=false     # Store user IDs vs anonymous tracking
OBSERVABILITY_STORE_REQUEST_BODIES=true # Toggle request body storage
OBSERVABILITY_STORE_RESPONSE_BODIES=true # Toggle response body storage
```

#### 4. API Endpoints

**Observability Routes** (`/observability/*`)
- `GET /observability/dashboard` - Dashboard data aggregation
- `GET /observability/events` - List events with filtering
- `GET /observability/requests/{id}` - Detailed request information
- `GET /observability/endpoint-overview` - Aggregated endpoint statistics with parameterized routes
- `GET /observability/metrics` - Aggregated metrics
- `POST /observability/frontend` - Frontend event submission
- `DELETE /observability/cleanup` - Manual cleanup trigger

**Endpoint Normalization**: The `/observability/endpoint-overview` endpoint normalizes specific endpoint paths to parameterized routes for better aggregation based on actual Hono route patterns:
- `/users/abc123` → `/users/:id` (matches actual `/users/:id` route)
- `/users/abc123/restore` → `/users/:id/restore` (matches actual restore route)
- `/observability/requests/def456` → `/observability/requests/:id`
- Static routes remain unchanged (e.g., `/auth/login`, `/dashboard/get-sidebar-items`)
- Unknown patterns with IDs are left as-is to avoid incorrect grouping

**Access Control**: All observability routes require `observability.read` permission

### Frontend Components

#### 1. Error Boundary Enhancement

**Global Error Boundary**
- Capture all React errors with component stack
- Send all error events to observability API
- Include user context and route information
- Complete stack trace capture for debugging

#### 2. Performance Monitoring

**Custom Hooks**
- `usePerformanceMonitor()` - Track basic SPA metrics (page load times, route transitions, component render times)
- `useErrorReporter()` - Report all errors to observability system
- `useObservabilityToggle()` - Check if observability is enabled

#### 3. Observability Dashboard Page

**Route**: `/observability`
**Components**:
- **MetricsOverview**: API endpoint statistics, error rates
- **RequestsTable**: Searchable table of recent requests
- **ErrorsPanel**: Frontend and backend errors with stack traces
- **PerformanceCharts**: Response time trends, frontend performance metrics
- **RequestDetail**: Detailed view of individual requests

## Implementation Details

### Backend Implementation

#### 1. Database Migrations

Create new tables following the existing schema patterns:
- Use CUID2 for primary keys
- Include proper indexes for performance
- Add foreign key relationships
- Implement soft deletion if needed

#### 2. Middleware Updates

**Enhanced Request Logger**:
```typescript
const observabilityMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  if (!appEnv.OBSERVABILITY_ENABLED) {
    await next();
    return;
  }

  const shouldRecord = shouldRecordRequest(c.req.path);
  if (!shouldRecord) {
    await next();
    return;
  }

  const startTime = performance.now();
  const requestData = captureRequestData(c);
  
  await next();
  
  const endTime = performance.now();
  const responseTime = Math.floor(endTime - startTime);
  
  await storeObservabilityEvent({
    eventType: 'api_request',
    requestId: c.var.requestId,
    userId: appEnv.OBSERVABILITY_ANONYMIZE_USERS ? null : c.var.uid,
    endpoint: c.req.path,
    method: c.req.method,
    statusCode: c.res.status,
    responseTimeMs: responseTime,
    metadata: appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA ? 
      sanitizeRequestData(requestData) : requestData
  });
});
```

#### 3. Data Retention

**Cleanup Service**:
- Automated cleanup of old records
- Configurable retention period
- Efficient batch deletion
- Optional compression for archived data

#### 4. Route Controls

**Recording Logic**:
```typescript
const shouldRecordRequest = (path: string): boolean => {
  if (!appEnv.OBSERVABILITY_ENABLED) return false;
  if (path.startsWith('/observability') && !appEnv.OBSERVABILITY_RECORD_SELF) return false;
  
  // Additional filtering logic
  return true;
};
```

#### 5. Data Masking Implementation

**Sensitive Data Detection**:
```typescript
const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credential/i,
  /bearer/i
];

const sanitizeRequestData = (data: any): any => {
  if (!appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA) return data;
  
  return sanitizeObject(data, SENSITIVE_FIELD_PATTERNS);
};

const sanitizeObject = (obj: any, patterns: RegExp[]): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (patterns.some(pattern => pattern.test(key))) {
      sanitized[key] = '[MASKED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, patterns);
    }
  }
  
  return sanitized;
};
```

**Masking Controls**:
- `OBSERVABILITY_MASK_SENSITIVE_DATA`: Global toggle for data masking
- `OBSERVABILITY_STORE_REQUEST_BODIES`: Control request body storage
- `OBSERVABILITY_STORE_RESPONSE_BODIES`: Control response body storage
- `OBSERVABILITY_ANONYMIZE_USERS`: Store user IDs vs anonymous tracking
```

### Frontend Implementation

#### 1. Error Monitoring

**Error Boundary Integration**:
```typescript
const reportError = async (error: Error, errorInfo: ErrorInfo) => {
  if (!isObservabilityEnabled()) return;
  
  await fetch('/observability/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'frontend_error',
      errorMessage: error.message,
      stackTrace: error.stack,
      componentStack: errorInfo.componentStack,
      route: window.location.pathname,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    })
  });
};
```

#### 2. Performance Tracking

**Performance Hook**:
```typescript
const usePerformanceMonitor = () => {
  useEffect(() => {
    // Track basic SPA metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          reportPerformanceMetric({
            type: 'page_load',
            duration: entry.duration,
            route: window.location.pathname
          });
        }
        if (entry.entryType === 'measure') {
          reportPerformanceMetric({
            type: 'route_transition',
            duration: entry.duration,
            name: entry.name
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation', 'measure'] });
    return () => observer.disconnect();
  }, []);
};
```

#### 3. Dashboard Components

**API Endpoint Overview**:
- Aggregated statistics grouped by parameterized routes (e.g., `/users/:userId`)
- Total requests, average response times, error rates per endpoint pattern
- Success rates and P95 response times
- Helps identify performance patterns across similar endpoints

**Request Details Table**:
- Individual request records with actual URLs (e.g., `/users/abc123`)
- Real-time request monitoring with specific user IDs and parameters
- User names, status codes, response times, IP addresses
- Useful for debugging specific requests and user issues

**Metrics Overview**:
- API endpoint success rates
- Average response times
- Error distribution
- Top slowest endpoints

**Frontend Logs Panel**:
- Console logs captured from frontend applications
- Log levels (debug, info, warn, error) with proper formatting
- User context and route information for each log entry

**Error Events Panel**:
- Both frontend and backend errors with complete stack traces
- Error source identification (frontend vs. backend API)
- User context and error message details
- Click-to-view stack traces for debugging

### Security Considerations

1. **Data Masking & Privacy Controls**:
   - Configurable masking of sensitive data (passwords, tokens, API keys)
   - Toggle between full data capture and masked data for internal team use
   - Clear user identification vs. anonymous tracking options
   - Configurable request/response body storage

2. **Access Control**:
   - Require 'observability.read' permission for dashboard access
   - Implement user-specific data filtering when not anonymized
   - Audit observability system access

3. **Storage Controls**:
   - Configurable retention periods (default 30 days)
   - Automatic truncation of large payloads
   - Rate limiting for frontend event submission

4. **Data Sanitization**:
   - Smart detection of sensitive fields (password, token, key, secret, etc.)
   - Configurable field masking patterns
   - Option to completely exclude sensitive endpoints from recording

### Performance Considerations

1. **Async Processing**:
   - Non-blocking observability data storage
   - Background cleanup processes
   - Batch insertions for high-traffic scenarios

2. **Database Optimization**:
   - Proper indexing on timestamp and user_id columns
   - Partitioning for large datasets
   - Read replicas for dashboard queries

3. **Frontend Impact**:
   - Minimal overhead for error reporting
   - Basic SPA performance metric collection (page loads, route transitions)
   - Graceful degradation when observability service is unavailable

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- [x] Create database schemas and migrations
- [x] Implement enhanced request logger middleware
- [x] Add observability environment configuration
- [x] Create basic API endpoints for data retrieval

### Phase 2: Frontend Integration (Week 2)
- [x] Implement error boundary enhancements
- [x] Create performance monitoring hooks
- [x] Add frontend event submission capability
- [x] Implement observability toggle logic

### Phase 3: Dashboard UI (Week 2-3)
- [x] Create observability route and layout
- [x] Implement metrics overview components
- [ ] Build request explorer interface
- [ ] Add error visualization components

### Phase 4: Controls & Optimization (Week 3-4)
- [ ] Implement data retention and cleanup
- [ ] Add advanced filtering and search
- [ ] Optimize database queries and indexes
- [ ] Add comprehensive testing

## Testing Strategy

1. **Unit Tests**:
   - Middleware functionality
   - Data sanitization logic
   - Performance metric calculations

2. **Integration Tests**:
   - End-to-end request flow
   - Frontend error reporting
   - Dashboard data accuracy

3. **Performance Tests**:
   - Impact on API response times
   - Database query performance
   - Frontend bundle size impact

4. **Security Tests**:
   - Data sanitization effectiveness
   - Access control validation
   - Rate limiting verification

## Monitoring & Maintenance

1. **System Health**:
   - Monitor observability system performance impact
   - Track storage growth and cleanup effectiveness
   - Alert on excessive error rates

2. **Data Quality**:
   - Validate data accuracy and completeness
   - Monitor for missing or corrupted events
   - Regular data consistency checks

3. **User Adoption**:
   - Track dashboard usage patterns
   - Gather feedback on usefulness
   - Identify additional metrics needs

## Success Metrics

1. **Functionality**:
   - 99%+ request capture rate
   - <50ms average observability overhead
   - Complete error stack trace capture for all errors

2. **Usability**:
   - <5 second dashboard load time
   - Effective error debugging capability with full stack traces
   - Clear performance trend visibility for SPA metrics

3. **Performance**:
   - <5% impact on API response times
   - Efficient data retention management (30-day default)
   - Scalable architecture with configurable data masking

## Risk Mitigation

1. **Performance Impact**:
   - Implement circuit breaker for observability failures
   - Async processing to prevent blocking
   - Configurable sampling rates for high-traffic scenarios

2. **Storage Growth**:
   - Automated cleanup with configurable retention (30-day default)
   - Storage size monitoring and alerts
   - Configurable data masking to reduce storage overhead

3. **Privacy Concerns**:
   - Clear data retention policies (30-day default)
   - Configurable user anonymization
   - Flexible data masking controls for internal team use

## Future Enhancements

1. **Advanced Analytics**:
   - Custom dashboard widgets
   - Metric correlations and insights
   - Performance regression detection

2. **Integration Options**:
   - Export to external monitoring tools
   - Webhook notifications for critical events
   - API for custom integrations

3. **Enhanced Debugging**:
   - Request replay capability
   - User session tracking
   - Advanced filtering and search

---

## Implementation Guidelines

### For Human Developers

1. **Follow Existing Patterns**:
   - Use established database schema conventions
   - Follow existing middleware patterns
   - Maintain consistent code style

2. **Security First**:
   - Review all data storage for sensitive information
   - Implement proper access controls
   - Test data sanitization thoroughly

3. **Performance Awareness**:
   - Profile observability impact
   - Optimize database queries
   - Monitor resource usage

### For LLM Agents

1. **Database Changes**:
   - Follow the established Drizzle ORM patterns
   - Use CUID2 for primary keys
   - Create proper relations and indexes
   - Do not edit migration files directly

2. **Middleware Integration**:
   - Extend existing request logger middleware
   - Respect environment configuration
   - Implement proper error handling

3. **Frontend Development**:
   - Use existing component patterns
   - Follow React best practices
   - Integrate with existing auth and routing systems

4. **Testing Requirements**:
   - Write comprehensive unit tests
   - Include integration test scenarios
   - Test edge cases and error conditions

This PRD provides a comprehensive blueprint for implementing minimal observability while maintaining the project's existing architecture and conventions. The implementation should be iterative, starting with basic functionality and gradually adding advanced features.
