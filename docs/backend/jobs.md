# Job Queue System

A robust, scalable job queue system built with HonoJS, Drizzle ORM, and PostgreSQL. This system enables asynchronous processing of background tasks with features like retries, scheduling, prioritization, and worker pool management.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Job Types](#job-types)
- [Configuration](#configuration)
- [Worker Management](#worker-management)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The job queue system provides asynchronous task processing with the following features:

### ✨ Key Features

- **Background Processing**: Execute tasks asynchronously without blocking request handling
- **Retry Logic**: Configurable retry strategies (exponential backoff, linear, fixed)
- **Job Scheduling**: Schedule jobs to run at specific times or in the future
- **Priority Queues**: High, normal, and low priority job processing
- **Worker Pool**: Configurable worker pool with automatic scaling
- **Job Cancellation**: Cancel pending jobs before execution
- **Monitoring**: Health checks, metrics, and job status tracking
- **Type Safety**: Full TypeScript support with type-safe job handlers

### 🏗️ Use Cases

- **Email Notifications**: Send welcome emails, password resets, newsletters
- **Data Processing**: Batch processing, report generation, data imports
- **File Operations**: Image resizing, file uploads, document generation
- **External API Calls**: Third-party integrations, webhook processing
- **Cleanup Tasks**: Data archiving, cache invalidation, log rotation

## Architecture

The job queue system is built with a modular architecture:

```
apps/backend/src/
├── jobs/                    # Job definitions and registry
│   ├── handlers/           # Job handler implementations
│   │   ├── email-notification.ts
│   │   └── data-processing.ts
│   ├── index.ts           # Main export point
│   ├── registry.ts        # Job handler registry
│   └── types.ts          # Job type definitions
└── services/jobs/         # Core job queue services
    ├── config.ts         # Configuration and retry strategies
    ├── queue-manager.ts  # Main job queue manager
    ├── worker.ts        # Individual worker implementation
    ├── worker-pool.ts   # Worker pool management
    ├── types.ts        # Service type definitions
    └── index.ts        # Service exports
```

### 🔧 Core Components

1. **JobQueueManager**: Main interface for creating, querying, and managing jobs
2. **WorkerPool**: Manages multiple worker instances for parallel processing
3. **JobWorker**: Individual worker that processes jobs from the queue
4. **JobHandlerRegistry**: Registry for job type handlers
5. **Configuration**: Centralized settings for workers, retries, and timeouts

## Getting Started

### 1. Import the Job Queue

```typescript
import { jobQueueManager, JobQueueManager } from "@/jobs";
```

### 2. Create a Job

```typescript
// Create an immediate job
const jobId = await jobQueueManager.createJob({
  type: "email-notification",
  payload: {
    userId: "user123",
    template: "welcome",
    data: { name: "John Doe" }
  },
  priority: "high"
});

// Schedule a job for later
const scheduledJobId = await jobQueueManager.createJob({
  type: "data-processing",
  payload: { batchId: "batch456" },
  scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
  maxRetries: 5
});
```

### 3. Query Jobs

```typescript
// Get a specific job
const job = await jobQueueManager.getJob(jobId);

// Get jobs with filtering
const pendingJobs = await jobQueueManager.getJobs({
  status: "pending",
  type: "email-notification",
  limit: 50
});

// Get all jobs for a user
const userJobs = await jobQueueManager.getJobs({
  payload: { userId: "user123" }
});
```

### 4. Cancel Jobs

```typescript
const cancelled = await jobQueueManager.cancelJob(jobId);
if (cancelled) {
  console.log("Job cancelled successfully");
}
```

## Job Types

### Creating Custom Job Handlers

1. **Define the Job Handler**:

```typescript
// apps/backend/src/jobs/handlers/my-custom-job.ts
import type { JobHandler } from "../types";

export interface MyCustomJobPayload {
  userId: string;
  action: string;
  data: Record<string, any>;
}

const myCustomJobHandler: JobHandler<MyCustomJobPayload> = {
  type: "my-custom-job",
  
  async execute(payload) {
    console.log(`Processing custom job for user ${payload.userId}`);
    
    // Your job logic here
    await processUserAction(payload.userId, payload.action, payload.data);
    
    return { 
      success: true, 
      message: `Custom job completed for user ${payload.userId}` 
    };
  },

  // Optional: Validation schema
  schema: z.object({
    userId: z.string(),
    action: z.string(),
    data: z.record(z.any()),
  }),
};

export default myCustomJobHandler;
```

2. **Register the Handler**:

```typescript
// apps/backend/src/jobs/registry.ts
import myCustomJobHandler from "./handlers/my-custom-job";

// Add to registry
jobHandlerRegistry.register(myCustomJobHandler);
```

### Built-in Job Types

#### Email Notification
```typescript
await jobQueueManager.createJob({
  type: "email-notification",
  payload: {
    userId: "user123",
    template: "welcome" | "password-reset" | "newsletter",
    data: { /* template variables */ }
  }
});
```

#### Data Processing
```typescript
await jobQueueManager.createJob({
  type: "data-processing",
  payload: {
    batchId: "batch456",
    operation: "import" | "export" | "transform",
    data: [/* array of data to process */]
  }
});
```

## Configuration

### Environment Variables

```bash
# Worker Configuration
JOB_QUEUE_MAX_WORKERS=5
JOB_QUEUE_POLL_INTERVAL=1000
JOB_QUEUE_MAX_JOBS_PER_WORKER=10
JOB_QUEUE_WORKER_TIMEOUT=300000
JOB_QUEUE_GRACEFUL_SHUTDOWN_TIMEOUT=30000

# Job Defaults
JOB_QUEUE_DEFAULT_MAX_RETRIES=3
JOB_QUEUE_DEFAULT_TIMEOUT_SECONDS=300

# Retry Configuration
JOB_QUEUE_RETRY_STRATEGY=exponential  # fixed | linear | exponential
JOB_QUEUE_RETRY_BASE_DELAY=1000
JOB_QUEUE_RETRY_MAX_DELAY=60000

# Monitoring
JOB_QUEUE_ENABLE_METRICS=true
JOB_QUEUE_METRICS_INTERVAL=60000
```

### Custom Configuration

```typescript
import { defaultJobQueueConfig } from "@/services/jobs";

const customConfig = {
  ...defaultJobQueueConfig,
  maxWorkers: 10,
  pollInterval: 500,
  retryStrategy: "linear" as const,
};

const customManager = new JobQueueManager(customConfig);
```

### Retry Strategies

```typescript
import { retryDelayCalculators } from "@/services/jobs";

// Fixed delay: same delay for each retry
const fixedDelay = retryDelayCalculators.fixed(attempt, 5000, 30000);

// Linear delay: increases linearly
const linearDelay = retryDelayCalculators.linear(attempt, 1000, 30000);

// Exponential backoff: doubles each time
const exponentialDelay = retryDelayCalculators.exponential(attempt, 1000, 30000);
```

## Worker Management

### Starting the Job Queue

```typescript
import { jobQueueManager } from "@/jobs";

// Initialize the job queue manager
await jobQueueManager.initialize();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await jobQueueManager.shutdown();
  process.exit(0);
});
```

### Worker Pool Management

```typescript
import { WorkerPool } from "@/services/jobs";

const workerPool = new WorkerPool({
  maxWorkers: 5,
  pollInterval: 1000,
  maxJobsPerWorker: 10
});

await workerPool.start();
await workerPool.stop();
```

### Individual Workers

```typescript
import { JobWorker } from "@/services/jobs";

const worker = new JobWorker("worker-1");
await worker.start();
await worker.stop();
```

## API Reference

### JobQueueManager

#### Methods

```typescript
class JobQueueManager {
  // Initialize the job queue
  async initialize(): Promise<void>
  
  // Shutdown the job queue
  async shutdown(): Promise<void>
  
  // Create a new job
  async createJob(options: CreateJobOptions): Promise<string>
  
  // Get a job by ID
  async getJob(jobId: string): Promise<Job | null>
  
  // Get jobs with filtering
  async getJobs(filters?: JobFilters): Promise<Job[]>
  
  // Cancel a pending job
  async cancelJob(jobId: string): Promise<boolean>
  
  // Get health check information
  async healthCheck(): Promise<HealthCheckResult>
  
  // Get registered job types
  getRegisteredTypes(): string[]
}
```

#### Types

```typescript
interface CreateJobOptions {
  type: string;
  payload: any;
  priority?: "high" | "normal" | "low";
  maxRetries?: number;
  timeoutSeconds?: number;
  scheduledAt?: Date;
}

interface JobFilters {
  status?: "pending" | "running" | "completed" | "failed" | "cancelled";
  type?: string;
  priority?: "high" | "normal" | "low";
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

interface Job {
  id: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: number;
  payload: any;
  result?: any;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  timeoutSeconds: number;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

## Testing

### Running Tests

```bash
# Run all job-related tests
bun run test src/jobs
bun run test src/services/jobs

# Run specific test files
bun run test src/services/jobs/queue-manager.test.ts
```

### Test Examples

```typescript
import { JobQueueManager } from "@/services/jobs";

describe("Custom Job Handler", () => {
  let jobQueueManager: JobQueueManager;

  beforeEach(async () => {
    jobQueueManager = new JobQueueManager();
    await jobQueueManager.initialize();
  });

  afterEach(async () => {
    await jobQueueManager.shutdown();
  });

  it("should process custom job successfully", async () => {
    const jobId = await jobQueueManager.createJob({
      type: "my-custom-job",
      payload: { userId: "test-user", action: "test", data: {} }
    });

    // Wait for job completion
    await new Promise(resolve => setTimeout(resolve, 1000));

    const job = await jobQueueManager.getJob(jobId);
    expect(job?.status).toBe("completed");
  });
});
```

## Monitoring

### Health Checks

```typescript
const health = await jobQueueManager.healthCheck();
console.log(health);
// {
//   status: "healthy",
//   workers: {
//     total: 5,
//     active: 3,
//     idle: 2
//   },
//   jobs: {
//     pending: 12,
//     running: 3,
//     completed: 150,
//     failed: 2
//   },
//   metrics: {
//     totalJobsProcessed: 152,
//     averageProcessingTime: 1250,
//     registeredTypes: ["email-notification", "data-processing"]
//   }
// }
```

### Job Metrics

```typescript
// Get job counts by status
const metrics = await jobQueueManager.getJobMetrics();

// Get processing statistics
const stats = await jobQueueManager.getProcessingStats();
```

### Logging

The job queue system uses structured logging:

```typescript
// Worker logs
INFO: Worker worker-123 started
INFO: Worker worker-123 processing job job-456
INFO: Worker worker-123 completed job job-456 in 1250ms

// Job logs
INFO: Job job-456 created with type email-notification
INFO: Job job-456 completed successfully
ERROR: Job job-789 failed: Connection timeout

// Pool logs
INFO: Worker pool started with 5 workers
INFO: Worker pool stopped
```

## Best Practices

### 1. Job Design

✅ **Do:**
- Keep job payloads small and serializable
- Make jobs idempotent (safe to retry)
- Use specific job types for different operations
- Include necessary context in the payload

❌ **Don't:**
- Store large objects in job payloads
- Create jobs that depend on external state
- Use generic job types for everything

### 2. Error Handling

✅ **Do:**
- Handle expected errors gracefully
- Use appropriate retry strategies
- Log meaningful error messages
- Set reasonable timeout values

```typescript
const jobHandler: JobHandler = {
  type: "api-call",
  async execute(payload) {
    try {
      const result = await externalApiCall(payload.endpoint, payload.data);
      return { success: true, data: result };
    } catch (error) {
      if (error.status === 429) {
        // Rate limited - should retry
        throw new Error("Rate limited, will retry");
      } else if (error.status >= 400 && error.status < 500) {
        // Client error - don't retry
        return { success: false, error: "Client error, not retrying" };
      } else {
        // Server error - should retry
        throw error;
      }
    }
  }
};
```

### 3. Performance

✅ **Do:**
- Use appropriate worker pool sizes
- Monitor job processing times
- Set reasonable job timeouts
- Use priority queues for urgent tasks

❌ **Don't:**
- Create too many workers (CPU bound)
- Set excessively long timeouts
- Block workers with synchronous operations

### 4. Testing

✅ **Do:**
- Test job handlers in isolation
- Test retry scenarios
- Test job cancellation
- Mock external dependencies

```typescript
// Mock external dependencies
jest.mock("@/services/email-service");

describe("Email Notification Job", () => {
  it("should handle email service failures", async () => {
    // Mock failure
    (emailService.send as jest.Mock).mockRejectedValue(new Error("Service down"));
    
    const handler = emailNotificationHandler;
    await expect(handler.execute(payload)).rejects.toThrow("Service down");
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Jobs Not Processing

**Problem**: Jobs stay in pending status
**Causes**:
- Worker pool not started
- No workers available
- Job handler not registered

**Solutions**:
```typescript
// Check if manager is initialized
if (!jobQueueManager.initialized) {
  await jobQueueManager.initialize();
}

// Check registered handlers
const types = jobQueueManager.getRegisteredTypes();
console.log("Registered job types:", types);

// Check worker pool status
const health = await jobQueueManager.healthCheck();
console.log("Worker status:", health.workers);
```

#### 2. Jobs Failing Repeatedly

**Problem**: Jobs fail and exhaust retries
**Causes**:
- Invalid payload data
- External service unavailable
- Timeout too short

**Solutions**:
```typescript
// Check job error messages
const job = await jobQueueManager.getJob(jobId);
console.log("Error:", job?.errorMessage);

// Adjust retry strategy
await jobQueueManager.createJob({
  type: "my-job",
  payload: { /* valid payload */ },
  maxRetries: 5,
  timeoutSeconds: 600 // 10 minutes
});
```

#### 3. Memory Issues

**Problem**: High memory usage
**Causes**:
- Too many workers
- Large job payloads
- Memory leaks in handlers

**Solutions**:
```typescript
// Reduce worker count
const config = {
  ...defaultJobQueueConfig,
  maxWorkers: 3,
  maxJobsPerWorker: 5
};

// Use streaming for large data
const jobHandler: JobHandler = {
  type: "large-data",
  async execute(payload) {
    // Process in chunks instead of loading all at once
    for (const chunk of getDataChunks(payload.dataSource)) {
      await processChunk(chunk);
    }
  }
};
```

#### 4. Database Locks

**Problem**: Job table locks causing delays
**Causes**:
- High concurrency
- Long-running transactions
- Missing indexes

**Solutions**:
```sql
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority 
ON jobs(status, priority) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at 
ON jobs(scheduled_at) WHERE scheduled_at IS NOT NULL;
```

### Debug Commands

```typescript
// Enable debug logging
process.env.LOG_LEVEL = "debug";

// Check job queue status
const health = await jobQueueManager.healthCheck();
console.log(JSON.stringify(health, null, 2));

// Get recent jobs
const recentJobs = await jobQueueManager.getJobs({
  limit: 10,
  createdAfter: new Date(Date.now() - 3600000) // last hour
});

// Check worker pool
const workerPool = jobQueueManager.workerPool;
console.log("Active workers:", workerPool.getActiveWorkerCount());
console.log("Idle workers:", workerPool.getIdleWorkerCount());
```

### Monitoring Checklist

- [ ] Check worker pool health regularly
- [ ] Monitor job processing times
- [ ] Set up alerts for failed jobs
- [ ] Track job queue depth
- [ ] Monitor database performance
- [ ] Check error logs daily

---

For more information, see:
- [Database Layer](database.md) - Database schema and migrations
- [Testing](testing.md) - Testing strategies and utilities
- [Best Practices](best-practices.md) - General coding best practices
