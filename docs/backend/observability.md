# Observability with OpenTelemetry and SigNoz

## Overview

This application uses **OpenTelemetry** for instrumentation and **SigNoz** as the observability backend. This setup provides distributed tracing, metrics, and logs with minimal code overhead.

### Why OpenTelemetry?

- **Industry Standard**: CNCF (Cloud Native Computing Foundation) standard
- **Vendor Neutral**: Works with any observability backend
- **Auto-Instrumentation**: Automatically tracks HTTP requests, database queries, etc.
- **Low Overhead**: <5ms per request impact
- **Zero Database Overhead**: No observability data stored in application database

### Architecture

```
Application (Hono + Bun)
    ↓
OpenTelemetry SDK (instrumentation)
    ↓
OTLP Exporter (HTTP)
    ↓
SigNoz Collector
    ↓
SigNoz Backend (ClickHouse)
    ↓
SigNoz UI (Dashboard)
```

## Quick Start

### 1. Environment Configuration

Add to your `.env` file:

```env
# Enable OpenTelemetry
OTEL_ENABLED=true

# Service name (appears in SigNoz)
OTEL_SERVICE_NAME=dashboard-backend

# SigNoz endpoint (local development)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# For SigNoz Cloud (optional):
# OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.{region}.signoz.cloud:443
# OTEL_EXPORTER_OTLP_HEADERS={"signoz-access-token":"YOUR_TOKEN"}
```

See `.env.example.otel` for complete configuration examples.

### 2. Start Your Application

```bash
cd apps/backend
bun run dev
```

The OpenTelemetry SDK initializes automatically when `OTEL_ENABLED=true`.

### 3. Access SigNoz

- **Local**: http://localhost:3301
- **Cloud**: https://app.signoz.io (or your region)

## What Gets Tracked Automatically

OpenTelemetry's auto-instrumentation tracks:

- ✅ **HTTP Requests**: All incoming/outgoing requests
- ✅ **Response Times**: P50, P95, P99 latencies
- ✅ **Status Codes**: 2xx, 4xx, 5xx counts
- ✅ **Database Queries**: PostgreSQL queries via Drizzle
- ✅ **External Calls**: HTTP requests to external APIs
- ✅ **Errors**: Exceptions with stack traces
- ✅ **Service Map**: Dependency relationships

**No code changes required** for basic observability!

## Custom Metrics

We track business-specific metrics defined in `src/utils/custom-metrics.ts`:

### Authentication Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `auth_login_attempts_total` | Counter | Total login attempts | `method` (email/google/microsoft) |
| `auth_login_success_total` | Counter | Successful logins | `method` |
| `auth_login_failures_total` | Counter | Failed logins | `reason` |
| `auth_active_users` | UpDownCounter | Currently active users | - |

**Where Used**: `routes/auth/login.ts`, `routes/auth/logout.ts`, `routes/auth/google/route.ts`, `routes/auth/microsoft/route.ts`

### User Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `user_creations_total` | Counter | User accounts created | `role`, `source` (google/microsoft) |
| `user_deletions_total` | Counter | User accounts deleted | - |

**Where Used**: OAuth routes (auto user creation)

### Permission Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `permission_denials_total` | Counter | Permission denials | `reason`, `route` |

**Where Used**: `middlewares/checkPermission.ts`

### Job Queue Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `jobs_enqueued_total` | Counter | Jobs added to queue | `job_type` |
| `jobs_completed_total` | Counter | Successfully completed jobs | `job_type` |
| `jobs_failed_total` | Counter | Failed jobs | `job_type`, `error_type` |
| `job_duration_ms` | Histogram | Job execution time | `job_type` |

**Where Used**: `services/jobs/queue-manager.ts`, `services/jobs/worker.ts`

### API Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `api_errors_by_type_total` | Counter | Errors by error type | `error_type`, `route` |

**Where Used**: `utils/error-tracking.ts` (called from error handler)

## Custom Spans

Custom spans provide detailed traces for critical operations:

### 1. Permission Checks

**File**: `middlewares/checkPermission.ts`

Every permission check creates a span with:
- Required permissions
- User's permissions
- Check result (allowed/denied)
- Denial reason (if applicable)

```typescript
// Span attributes added:
- permission.required: "users.read,users.write"
- permission.result: "allowed" | "denied_insufficient" | "denied_not_authenticated"
- user.permissions: "users.read"
- http.route: "/users"
```

### 2. Error Tracking

**File**: `utils/error-tracking.ts`

All errors are automatically recorded with:
- Exception details and stack trace
- HTTP context (route, method, status)
- Error type classification

```typescript
// Usage (automatic in error handler):
recordError(error, context)
```

## Querying Data in SigNoz

### Common Queries

**Find slow endpoints (>500ms)**:
```
name = http.server.duration
WHERE http.status_code = 200
AND duration > 500
ORDER BY duration DESC
```

**Error rate by endpoint**:
```
name = http.server.request.count
WHERE http.status_code >= 400
GROUP BY http.route
```

**Failed login attempts**:
```
name = auth_login_failures_total
GROUP BY reason
```

**Job queue health**:
```
name = jobs_failed_total
GROUP BY job_type
```

**Permission denials by route**:
```
name = permission_denials_total
GROUP BY route, reason
```

## Dashboard Recommendations

### 1. API Performance Dashboard
- Request rate by endpoint
- P95/P99 latency trends
- Error rate percentage
- Top 10 slowest endpoints

### 2. Authentication Dashboard
- Login attempts (success/failure ratio)
- Active users count
- Failed login reasons breakdown
- Authentication errors

### 3. Job Queue Dashboard
- Jobs enqueued vs completed
- Job failure rate by type
- Job duration histogram
- Failed jobs alerts

### 4. Error Tracking Dashboard
- Total errors over time
- Errors by type and route
- Recent error traces
- Error rate by endpoint

### 5. Security Dashboard
- Permission denials by route
- Authentication failures
- Suspicious activity patterns

## Adding Custom Instrumentation

### Adding a New Metric

1. **Define in `custom-metrics.ts`**:

```typescript
export const myMetrics = {
    operationCount: meter.createCounter("my_operation_total", {
        description: "Total operations performed",
    }),
}
```

2. **Use in your code**:

```typescript
import { myMetrics } from "../../utils/custom-metrics"

myMetrics.operationCount.add(1, {
    operation_type: "create",
    status: "success",
})
```

### Adding a Custom Span

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api"

const tracer = trace.getTracer("dashboard-backend")

export async function criticalOperation() {
    return tracer.startActiveSpan("operation.critical", async (span) => {
        try {
            // Add custom attributes
            span.setAttribute("operation.type", "create")
            span.setAttribute("user.id", userId)
            
            // Your business logic
            const result = await performOperation()
            
            // Mark success
            span.setStatus({ code: SpanStatusCode.OK })
            
            return result
        } catch (error) {
            // Record exception
            span.recordException(error as Error)
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as Error).message,
            })
            throw error
        } finally {
            span.end()
        }
    })
}
```

## Performance Considerations

### Overhead

- **Target**: <5ms per request
- **Actual**: ~2-3ms in production
- **Metric Export**: Every 60 seconds (async, non-blocking)
- **Trace Sampling**: 100% (adjust for high-traffic apps)

### Optimization Tips

1. **Skip Noisy Endpoints**: Already configured to skip `/health`, `/favicon.ico`, `/robots.txt`
2. **Adjust Export Interval**: Modify `exportIntervalMillis` in `telemetry.ts`
3. **Sampling**: For high-traffic apps, configure trace sampling
4. **Disable in Tests**: Set `OTEL_ENABLED=false` in test environment

## Troubleshooting

### No Data in SigNoz

1. **Check if enabled**:
   ```bash
   grep OTEL_ENABLED .env
   # Should be: OTEL_ENABLED=true
   ```

2. **Check console for initialization**:
   ```
   ✅ OpenTelemetry initialized successfully
   📊 Exporting to: http://localhost:4318
   ```

3. **Verify SigNoz is running**:
   ```bash
   curl http://localhost:4318/v1/traces
   # Should return 200 or 405
   ```

4. **Check network connectivity**:
   ```bash
   # Test from within your app container if using Docker
   curl http://signoz-collector:4318/v1/traces
   ```

### High Memory Usage

- Check metric export interval (default: 60s)
- Reduce trace sampling rate
- Verify no span leaks (always call `span.end()`)

### Missing Metrics

- Ensure metrics are properly exported (check `custom-metrics.ts`)
- Verify metric names don't have typos
- Check labels are consistent

### Errors Not Appearing

- Ensure `recordError()` is called in error handler
- Check error handler in `index.ts` has `recordError(err, c)`
- Verify `OTEL_ENABLED=true`

## Disabling Telemetry

To disable OpenTelemetry (e.g., in development):

```env
OTEL_ENABLED=false
```

The application works normally with zero overhead when disabled.

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OTEL_ENABLED` | No | `false` | Enable/disable OpenTelemetry |
| `OTEL_SERVICE_NAME` | No | `dashboard-backend` | Service identifier in SigNoz |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | `http://localhost:4318` | SigNoz collector URL |
| `OTEL_EXPORTER_OTLP_HEADERS` | No | - | Additional headers (JSON string) |

## Best Practices

### ✅ Do

- Use descriptive metric names with consistent naming conventions
- Add relevant labels/attributes to metrics and spans
- Record exceptions in spans for better error tracking
- Set span status (`OK` or `ERROR`) appropriately
- Use counters for cumulative values
- Use histograms for distributions (durations, sizes)

### ❌ Don't

- Add sensitive data to span attributes (passwords, tokens, PII)
- Create high-cardinality labels (e.g., user IDs in metric labels)
- Forget to call `span.end()` in custom spans
- Block on telemetry operations (always async)
- Over-instrument (focus on critical paths)

## Related Documentation

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [SigNoz Docs](https://signoz.io/docs/)
- [API Documentation](./api-docs.md)
- [Error Handling](./best-practices.md#error-handling)
- [Job Queue](./jobs.md)

## Migration Notes

This application was migrated from a custom database-backed observability system to OpenTelemetry + SigNoz on October 19, 2025. The migration achieved:

- **90% code reduction** (2000+ lines → 205 lines)
- **Zero database overhead** (removed 2 tables)
- **Better performance** (async export vs sync DB writes)
- **Enterprise features** (distributed tracing, service maps, advanced analytics)

See `PRDs/signoz-migration.md` for complete migration details.

---

**Last Updated**: November 1, 2025  
**Maintainer**: Backend Team
