# PRD: Minimal Observability System

## Overview

This PRD outlines the implementation of a minimal observability system for the dashboard template application. The system will provide essential monitoring capabilities for API endpoints and frontend events while maintaining simplicity and performance.

## Objectives

1. **API Monitoring**: Track endpoint performance, 4. **Storage Con3. **Async Processing**:
   - Non-blocking observability data storage
   - Background cleanup processes
   - Batch insertions for high-traffic scenarios
   - Filtering of high-frequency, low-value requests (e.g., CORS preflight OPTIONS requests)s**:
   - Configurable retention periods (default 30 days)
   - Automatic truncation of large payloads
   - Rate limiting for frontend event submission
   - OPTIONS method filtering to reduce noise from CORS preflight requestsonse codes, and request patterns
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
OBSERVABILITY_RECORD_OPTIONS=false  # Record OPTIONS method requests (CORS preflight)
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

### Full-Page Modals with Shareable URLs

#### Modal Route Structure
```typescript
// Add these routes to your router configuration
const routes = [
  // Existing observability routes
  '/observability',
  '/observability/settings',
  
  // New full-page modal routes
  '/observability/request/:requestId',
  '/observability/error/:errorId',
  '/observability/stack-trace/:traceId',
  '/observability/request/:requestId/response',
  '/observability/request/:requestId/headers',
];
```

#### Request Detail Full-Page Modal
```typescript
// src/routes/_dashboardLayout/observability/request/$requestId.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createLazyFileRoute('/_dashboardLayout/observability/request/$requestId')({
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { requestId } = Route.useParams();
  const navigate = Route.useNavigate();
  
  const { data: requestDetail, isLoading } = useQuery({
    queryKey: ['observability', 'request', requestId],
    queryFn: () => honoClient.observability.requests[':id'].$get({ param: { id: requestId } }),
  });

  const shareUrl = `${window.location.origin}/observability/request/${requestId}`;

  const copyShareUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    // Show toast notification
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!requestDetail) {
    return <div className="text-center h-64">Request not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate({ to: '/observability' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Observability
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Request Details</h1>
            <p className="text-muted-foreground">
              {requestDetail.method} {requestDetail.endpoint}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyShareUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={shareUrl} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

      {/* Request Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Method</label>
              <Badge variant={getMethodVariant(requestDetail.method)}>
                {requestDetail.method}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={getStatusVariant(requestDetail.statusCode)}>
                {requestDetail.statusCode}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Response Time</label>
              <p className="font-mono">{requestDetail.responseTimeMs}ms</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <p className="font-mono">{new Date(requestDetail.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="request" className="space-y-6">
        <TabsList>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="user">User Context</TabsTrigger>
          {requestDetail.errorMessage && (
            <TabsTrigger value="error">Error Details</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Endpoint</label>
                  <p className="font-mono bg-muted p-2 rounded">{requestDetail.endpoint}</p>
                </div>
                
                {requestDetail.queryParams && (
                  <div>
                    <label className="text-sm font-medium">Query Parameters</label>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(requestDetail.queryParams, null, 2)}
                    </pre>
                  </div>
                )}
                
                {requestDetail.requestBody && (
                  <div>
                    <label className="text-sm font-medium">Request Body</label>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(requestDetail.requestBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response">
          <Card>
            <CardHeader>
              <CardTitle>Response Details</CardTitle>
            </CardHeader>
            <CardContent>
              {requestDetail.responseBody ? (
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(requestDetail.responseBody, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No response body available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>User Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="font-mono">{requestDetail.userId || 'Anonymous'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="font-mono">{requestDetail.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">User Agent</label>
                  <p className="text-sm break-all">{requestDetail.userAgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {requestDetail.errorMessage && (
          <TabsContent value="error">
            <Card>
              <CardHeader>
                <CardTitle>Error Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Error Message</label>
                    <p className="text-red-600 bg-red-50 p-3 rounded border">
                      {requestDetail.errorMessage}
                    </p>
                  </div>
                  
                  {requestDetail.stackTrace && (
                    <div>
                      <label className="text-sm font-medium">Stack Trace</label>
                      <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                        {requestDetail.stackTrace}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function getMethodVariant(method: string): "default" | "secondary" | "destructive" | "outline" {
  switch (method) {
    case 'GET': return 'default';
    case 'POST': return 'secondary';
    case 'PUT': return 'outline';
    case 'DELETE': return 'destructive';
    default: return 'outline';
  }
}

function getStatusVariant(status: number): "default" | "secondary" | "destructive" | "outline" {
  if (status >= 200 && status < 300) return 'default';
  if (status >= 300 && status < 400) return 'secondary';
  if (status >= 400) return 'destructive';
  return 'outline';
}
```

#### Stack Trace Full-Page Modal
```typescript
// src/routes/_dashboardLayout/observability/stack-trace/$traceId.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Route = createLazyFileRoute('/_dashboardLayout/observability/stack-trace/$traceId')({
  component: StackTracePage,
});

function StackTracePage() {
  const { traceId } = Route.useParams();
  const navigate = Route.useNavigate();
  
  const { data: errorDetail, isLoading } = useQuery({
    queryKey: ['observability', 'error', traceId],
    queryFn: () => honoClient.observability.errors[':id'].$get({ param: { id: traceId } }),
  });

  const shareUrl = `${window.location.origin}/observability/stack-trace/${traceId}`;

  const copyShareUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const copyStackTrace = async () => {
    if (errorDetail?.stackTrace) {
      await navigator.clipboard.writeText(errorDetail.stackTrace);
    }
  };

  const downloadStackTrace = () => {
    if (errorDetail?.stackTrace) {
      const blob = new Blob([errorDetail.stackTrace], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stack-trace-${traceId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!errorDetail) {
    return <div className="text-center h-64">Stack trace not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate({ to: '/observability' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Observability
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Stack Trace Details</h1>
            <p className="text-muted-foreground">{errorDetail.errorMessage}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyShareUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
          <Button variant="outline" size="sm" onClick={copyStackTrace}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Stack Trace
          </Button>
          <Button variant="outline" size="sm" onClick={downloadStackTrace}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={shareUrl} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

      {/* Error Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Error Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Error Type</label>
              <Badge variant="destructive">{errorDetail.eventType}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
              <p className="font-mono text-sm">{errorDetail.endpoint}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="font-mono text-sm">{errorDetail.userId || 'Anonymous'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <p className="font-mono text-sm">{new Date(errorDetail.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Error Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">{errorDetail.errorMessage}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stack Trace */}
      <Card>
        <CardHeader>
          <CardTitle>Stack Trace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {errorDetail.stackTrace}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Real-time Dashboard Integration

#### Enhanced Dashboard with WebSocket
```typescript
// Update existing observability dashboard to use WebSocket
export function ObservabilityDashboard() {
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [filters, setFilters] = useState({
    method: '',
    status: '',
    endpoint: '',
  });

  // WebSocket connection for real-time updates
  const { isConnected, events: realtimeEvents, connectionStatus } = useObservabilityWebSocket({
    eventTypes: ['api_request', 'frontend_error'],
    autoReconnect: true,
  });

  // Merge real-time events with existing data
  const [allEvents, setAllEvents] = useState<any[]>([]);
  
  useEffect(() => {
    if (realtimeEnabled && realtimeEvents.length > 0) {
      setAllEvents(prev => {
        const combined = [...realtimeEvents, ...prev];
        // Remove duplicates and limit to 500 items
        const unique = combined.filter((event, index, self) => 
          index === self.findIndex(e => e.id === event.id)
        );
        return unique.slice(0, 500);
      });
    }
  }, [realtimeEvents, realtimeEnabled]);

  return (
    <div className="container mx-auto p-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Observability Dashboard</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <Switch
              checked={realtimeEnabled}
              onCheckedChange={setRealtimeEnabled}
            />
            <Label htmlFor="realtime">Real-time Updates</Label>
          </div>
        </div>
        
        <Button asChild>
          <Link to="/observability/settings">
            Settings
          </Link>
        </Button>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        <MetricsOverview events={allEvents} />
        
        <RequestsTable 
          events={allEvents}
          onRequestClick={(requestId) => {
            // Navigate to full-page modal
            navigate({ to: '/observability/request/$requestId', params: { requestId } });
          }}
        />
        
        <ErrorsSection 
          events={allEvents.filter(e => e.eventType === 'frontend_error')}
          onStackTraceClick={(traceId) => {
            // Navigate to full-page stack trace modal
            navigate({ to: '/observability/stack-trace/$traceId', params: { traceId } });
          }}
        />
      </div>
    </div>
  );
}
```

#### WebSocket Environment Configuration
```env
# Add to backend .env files
WEBSOCKET_PORT=8081
WEBSOCKET_ENABLED=true
WEBSOCKET_PING_INTERVAL=30000
WEBSOCKET_MAX_CLIENTS=100
```

### URL Structure for Shareable Links

#### Deep Linking Patterns
```typescript
// Full-page modal URLs with shareable state
/observability/request/abc123                    // Basic request detail
/observability/request/abc123?tab=response       // Direct to response tab
/observability/request/abc123?tab=headers        // Direct to headers tab
/observability/stack-trace/def456               // Stack trace detail
/observability/error/ghi789                     // Error detail page

// URL parameters for context preservation
/observability/request/abc123?
  tab=request&
  highlight=line:45&
  from=/observability&
  filter=method:POST

// Shareable URLs maintain state
const shareableUrl = buildShareableUrl({
  requestId: 'abc123',
  tab: 'response',
  filters: { method: 'POST', status: '500' },
  source: 'dashboard'
});
```

#### URL State Management
```typescript
// Hook for managing shareable URL state
export function useShareableUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const buildShareableUrl = (params: {
    requestId?: string;
    traceId?: string;
    tab?: string;
    filters?: Record<string, string>;
    source?: string;
  }) => {
    const url = new URL(window.location.origin);
    
    if (params.requestId) {
      url.pathname = `/observability/request/${params.requestId}`;
    } else if (params.traceId) {
      url.pathname = `/observability/stack-trace/${params.traceId}`;
    }
    
    if (params.tab) url.searchParams.set('tab', params.tab);
    if (params.source) url.searchParams.set('from', params.source);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        url.searchParams.set(`filter_${key}`, value);
      });
    }
    
    return url.toString();
  };
  
  const parseUrlState = () => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      tab: params.tab,
      source: params.from,
      filters: Object.fromEntries(
        Object.entries(params)
          .filter(([key]) => key.startsWith('filter_'))
          .map(([key, value]) => [key.replace('filter_', ''), value])
      ),
    };
  };
  
  return { buildShareableUrl, parseUrlState };
}
```