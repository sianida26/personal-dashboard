# Background Job Queue System - PRD

## Overview
This document outlines the requirements and design for implementing a fully customized background job queue system for the dashboard template. The system will be built from scratch without external libraries, integrated with the existing HonoJS + Drizzle ORM + PostgreSQL backend.

## 1. Purpose and Scope

### 1.1 Objectives
- Provide a reliable, persistent background job processing system
- Support job prioritization, scheduling, and retry mechanisms
- Integrate seamlessly with the existing backend architecture
- Offer monitoring and observability capabilities
- Support horizontal scaling for future growth

### 1.2 Target Use Cases
- Email notifications and bulk communications
- Data processing and ETL operations
- Scheduled maintenance tasks
- File processing and uploads
- Report generation
- Third-party API integrations
- Database cleanup and optimization tasks

## 2. Technical Architecture

### 2.1 Core Components

#### 2.1.1 Job Queue Manager
- **Location**: `apps/backend/src/services/job-queue-manager.ts`
- **Responsibilities**:
  - Job creation and queuing
  - Worker pool management
  - Job status tracking
  - Retry logic coordination

#### 2.1.2 Job Workers
- **Location**: `apps/backend/src/services/job-workers.ts`
- **Responsibilities**:
  - Job execution
  - Error handling
  - Status reporting
  - Concurrency management

#### 2.1.3 Job Handlers
- **Location**: `apps/backend/src/jobs/`
- **Structure**:
  ```
  apps/backend/src/jobs/
  ├── index.ts                    # Job handler registry
  ├── types.ts                    # Job types and interfaces
  ├── handlers/
  │   ├── email-notification.ts   # Email sending jobs
  │   ├── data-processing.ts      # Data processing jobs
  │   ├── file-upload.ts          # File processing jobs
  │   ├── report-generation.ts    # Report generation jobs
  │   └── scheduled-cleanup.ts    # Maintenance jobs
  └── examples/
      ├── simple-job.ts           # Basic job example
      └── complex-job.ts          # Advanced job example
  ```

#### 2.1.4 Database Schema
- **Location**: `apps/backend/src/drizzle/schema/job-queue.ts`
- **Tables**:
  - `jobs` - Main job records
  - `job_executions` - Job execution history
  - `job_schedules` - Scheduled job configurations

### 2.2 Process Architecture

#### Option A: Integrated Process (Recommended for Template)
- Jobs run within the same process as the main backend
- Shared database connection pool
- Easier development and debugging
- Lower resource overhead

#### Option B: Separate Process
- Dedicated job worker process
- Independent scaling
- Better isolation
- More complex deployment

**Decision**: Start with Option A (integrated process) for simplicity, with architecture designed to support Option B in the future.

## 3. Database Design

### 3.1 Jobs Table
```sql
CREATE TABLE jobs (
    id VARCHAR(25) PRIMARY KEY,                    -- CUID2
    type VARCHAR(100) NOT NULL,                    -- Job type identifier
    priority INTEGER NOT NULL DEFAULT 0,          -- Job priority (higher = more important)
    payload JSONB NOT NULL,                        -- Job data
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,        -- When to run (NULL = run immediately)
    started_at TIMESTAMP WITH TIME ZONE,          -- When execution started
    completed_at TIMESTAMP WITH TIME ZONE,        -- When execution completed
    failed_at TIMESTAMP WITH TIME ZONE,           -- When execution failed
    retry_count INTEGER NOT NULL DEFAULT 0,       -- Number of retry attempts
    max_retries INTEGER NOT NULL DEFAULT 3,       -- Maximum retry attempts
    error_message TEXT,                            -- Last error message
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(25),                        -- User who created the job
    worker_id VARCHAR(50),                         -- Worker processing the job
    timeout_seconds INTEGER DEFAULT 300,          -- Job timeout in seconds
    tags JSONB DEFAULT '[]'::JSONB                 -- Job tags for filtering
);

-- Indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduled_at);
CREATE INDEX idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
```

### 3.2 Job Executions Table
```sql
CREATE TABLE job_executions (
    id VARCHAR(25) PRIMARY KEY,                    -- CUID2
    job_id VARCHAR(25) NOT NULL,                   -- Foreign key to jobs
    attempt_number INTEGER NOT NULL,               -- Execution attempt number
    status VARCHAR(20) NOT NULL,                   -- pending, processing, completed, failed
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    worker_id VARCHAR(50),
    execution_time_ms INTEGER,                     -- Execution duration
    memory_usage_mb INTEGER,                       -- Memory usage during execution
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX idx_job_executions_status ON job_executions(status);
```

### 3.3 Job Schedules Table
```sql
CREATE TABLE job_schedules (
    id VARCHAR(25) PRIMARY KEY,                    -- CUID2
    name VARCHAR(100) NOT NULL UNIQUE,            -- Schedule name
    job_type VARCHAR(100) NOT NULL,               -- Job type to create
    cron_expression VARCHAR(100) NOT NULL,        -- Cron expression
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,   -- Default job payload
    is_active BOOLEAN NOT NULL DEFAULT TRUE,      -- Schedule active status
    timezone VARCHAR(50) DEFAULT 'UTC',           -- Schedule timezone
    last_run_at TIMESTAMP WITH TIME ZONE,         -- Last execution time
    next_run_at TIMESTAMP WITH TIME ZONE,         -- Next scheduled execution
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(25)                        -- User who created the schedule
);

-- Indexes
CREATE INDEX idx_job_schedules_next_run_at ON job_schedules(next_run_at);
CREATE INDEX idx_job_schedules_is_active ON job_schedules(is_active);
```

## 4. Core Features

### 4.1 Job Management

#### 4.1.1 Job Creation
```typescript
interface CreateJobOptions {
  type: string;
  payload: Record<string, any>;
  priority?: number;
  scheduledAt?: Date;
  maxRetries?: number;
  timeoutSeconds?: number;
  tags?: string[];
  createdBy?: string;
}

// Usage
const job = await jobQueue.create({
  type: 'email-notification',
  payload: { userId: '123', template: 'welcome' },
  priority: 1,
  maxRetries: 3
});
```

#### 4.1.2 Job Priorities
- **Critical (10)**: System-critical jobs (password resets, security alerts)
- **High (5)**: User-facing jobs (email notifications, real-time updates)
- **Normal (0)**: Standard jobs (data processing, reports)
- **Low (-5)**: Background maintenance (cleanup, optimization)

#### 4.1.3 Job Scheduling
- Support for one-time scheduled jobs
- Cron-like recurring schedules
- Timezone-aware scheduling

### 4.2 Worker Pool Management

#### 4.2.1 Worker Configuration
```typescript
interface WorkerPoolConfig {
  maxWorkers: number;
  pollInterval: number;
  maxJobsPerWorker: number;
  workerTimeout: number;
  gracefulShutdownTimeout: number;
}
```

#### 4.2.2 Worker Lifecycle
- Worker spawning and cleanup
- Job assignment and load balancing
- Health monitoring and recovery
- Graceful shutdown handling

### 4.3 Retry Mechanism

#### 4.3.1 Retry Strategies
- **Exponential backoff**: 2^attempt seconds (default)
- **Linear backoff**: attempt * delay seconds
- **Fixed delay**: constant delay
- **Custom**: user-defined retry logic

#### 4.3.2 Retry Configuration
```typescript
interface RetryConfig {
  maxRetries: number;
  strategy: 'exponential' | 'linear' | 'fixed' | 'custom';
  baseDelay: number;
  maxDelay: number;
  customRetryFn?: (attempt: number) => number;
}
```

### 4.4 Monitoring and Observability

#### 4.4.1 Metrics Collection
- Job completion rates
- Average execution time
- Error rates by job type
- Queue depth and processing lag
- Worker utilization

#### 4.4.2 Logging Integration
- Use existing logger (`apps/backend/src/utils/logger.ts`)
- Structured logging with job context
- Error tracking with stack traces
- Performance metrics logging

#### 4.4.3 Health Checks
- Worker pool health endpoint
- Queue status monitoring
- Database connection health
- Job processing statistics

## 5. API Design

### 5.1 Job Management Endpoints

#### 5.1.1 Create Job
```
POST /jobs
Content-Type: application/json

{
  "type": "email-notification",
  "payload": { "userId": "123", "template": "welcome" },
  "priority": 1,
  "scheduledAt": "2025-07-07T10:00:00Z",
  "maxRetries": 3,
  "tags": ["user-onboarding"]
}
```

#### 5.1.2 Get Job Status
```
GET /jobs/:id
```

#### 5.1.3 List Jobs
```
GET /jobs?status=pending&type=email-notification&limit=50&offset=0
```

#### 5.1.4 Cancel Job
```
DELETE /jobs/:id
```

### 5.2 Schedule Management Endpoints

#### 5.2.1 Create Schedule
```
POST /jobs/schedules
Content-Type: application/json

{
  "name": "daily-cleanup",
  "jobType": "cleanup",
  "cronExpression": "0 2 * * *",
  "payload": { "retention": 30 },
  "timezone": "UTC"
}
```

#### 5.2.2 List Schedules
```
GET /jobs/schedules
```

#### 5.2.3 Update Schedule
```
PUT /jobs/schedules/:id
```

### 5.3 Monitoring Endpoints

#### 5.3.1 Queue Statistics
```
GET /jobs/stats
```

#### 5.3.2 Worker Pool Status
```
GET /jobs/workers
```

#### 5.3.3 Health Check
```
GET /jobs/health
```

## 6. Job Handler Interface

### 6.1 Handler Definition
```typescript
interface JobHandler<T = any> {
  type: string;
  description: string;
  defaultMaxRetries: number;
  defaultTimeoutSeconds: number;
  execute(payload: T, context: JobContext): Promise<JobResult>;
  validate?(payload: unknown): T;
  onFailure?(error: Error, context: JobContext): Promise<void>;
  onSuccess?(result: JobResult, context: JobContext): Promise<void>;
}

interface JobContext {
  jobId: string;
  attempt: number;
  createdBy?: string;
  logger: Logger;
  signal: AbortSignal;
}

interface JobResult {
  success: boolean;
  data?: any;
  message?: string;
  shouldRetry?: boolean;
}
```

### 6.2 Handler Registration
```typescript
// apps/backend/src/jobs/index.ts
import { JobHandlerRegistry } from '../services/job-queue-manager';
import emailNotificationHandler from './handlers/email-notification';
import dataProcessingHandler from './handlers/data-processing';

const registry = new JobHandlerRegistry();

registry.register(emailNotificationHandler);
registry.register(dataProcessingHandler);

export default registry;
```

### 6.3 Example Handler
```typescript
// apps/backend/src/jobs/handlers/email-notification.ts
import { JobHandler } from '../types';
import { z } from 'zod';

const payloadSchema = z.object({
  userId: z.string(),
  template: z.string(),
  data: z.record(z.any()).optional()
});

const emailNotificationHandler: JobHandler = {
  type: 'email-notification',
  description: 'Send email notifications to users',
  defaultMaxRetries: 3,
  defaultTimeoutSeconds: 30,
  
  validate(payload: unknown) {
    return payloadSchema.parse(payload);
  },
  
  async execute(payload, context) {
    const { userId, template, data } = payload;
    
    try {
      // Send email logic here
      await sendEmail(userId, template, data);
      
      return {
        success: true,
        message: `Email sent to user ${userId}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        shouldRetry: true
      };
    }
  },
  
  async onFailure(error, context) {
    context.logger.error('Email notification failed', {
      jobId: context.jobId,
      error: error.message
    });
  }
};

export default emailNotificationHandler;
```

## 7. Implementation Plan

### 7.1 Phase 1: Core Infrastructure (Week 1-2) ✅ COMPLETED
- [x] Database schema design and migration
- [x] Job queue manager service
- [x] Basic worker pool implementation
- [x] Job creation and execution flow
- [x] Unit tests for core components

### 7.2 Phase 2: Advanced Features (Week 3-4)
- [ ] Job prioritization system
- [ ] Retry mechanism with strategies
- [ ] Job scheduling functionality
- [ ] Cron-based recurring jobs
- [ ] Integration tests

### 7.3 Phase 3: Monitoring and APIs (Week 5-6)
- [ ] REST API endpoints for job management
- [ ] Monitoring and metrics collection
- [ ] Health check endpoints
- [ ] Job execution history tracking
- [ ] Performance optimization

### 7.4 Phase 4: Documentation and Examples (Week 7-8)
- [ ] Comprehensive documentation
- [ ] Example job handlers
- [ ] Developer guide
- [ ] API documentation
- [ ] Load testing and benchmarks

## Implementation Status

### ✅ Completed (Phase 1)
- **Database Schema**: Complete job queue schema with jobs, job_executions, and job_schedules tables
- **Job Types & Interfaces**: Comprehensive type definitions for all job components
- **Job Handler Registry**: Centralized registry for job handlers with registration/deregistration
- **Worker Pool**: Multi-worker job processing with proper lifecycle management
- **Job Queue Manager**: Core service for job creation, querying, cancellation, and metrics
- **Example Handlers**: Email notification and data processing example implementations
- **Unit Tests**: Comprehensive test coverage for all core components
- **Integration**: Full integration with existing backend architecture

### 🔄 In Progress
- None currently

### 📋 Remaining (Future Phases)
- Job prioritization system
- Advanced retry mechanisms
- Job scheduling functionality
- REST API endpoints
- Monitoring dashboard
- Performance optimization

## 8. Configuration

### 8.1 Environment Variables
```bash
# Job Queue Configuration
JOB_QUEUE_MAX_WORKERS=5
JOB_QUEUE_POLL_INTERVAL=1000
JOB_QUEUE_MAX_JOBS_PER_WORKER=10
JOB_QUEUE_WORKER_TIMEOUT=300000
JOB_QUEUE_GRACEFUL_SHUTDOWN_TIMEOUT=30000

# Retry Configuration
JOB_QUEUE_DEFAULT_MAX_RETRIES=3
JOB_QUEUE_DEFAULT_TIMEOUT_SECONDS=300
JOB_QUEUE_RETRY_STRATEGY=exponential
JOB_QUEUE_RETRY_BASE_DELAY=1000
JOB_QUEUE_RETRY_MAX_DELAY=60000

# Monitoring
JOB_QUEUE_ENABLE_METRICS=true
JOB_QUEUE_METRICS_INTERVAL=60000
```

### 8.2 Default Configuration
```typescript
// apps/backend/src/services/job-queue-config.ts
export const defaultJobQueueConfig = {
  maxWorkers: 5,
  pollInterval: 1000,
  maxJobsPerWorker: 10,
  workerTimeout: 300000,
  gracefulShutdownTimeout: 30000,
  defaultMaxRetries: 3,
  defaultTimeoutSeconds: 300,
  retryStrategy: 'exponential' as const,
  retryBaseDelay: 1000,
  retryMaxDelay: 60000,
  enableMetrics: true,
  metricsInterval: 60000
};
```

## 9. Testing Strategy

### 9.1 Unit Tests
- Job queue manager functionality
- Worker pool operations
- Retry mechanism logic
- Job handler execution
- Database operations

### 9.2 Integration Tests
- End-to-end job processing
- API endpoint testing
- Database integration
- Error handling scenarios
- Performance benchmarks

### 9.3 Load Testing
- High job volume processing
- Worker pool scalability
- Database performance under load
- Memory usage monitoring
- Retry mechanism stress testing

## 10. Security Considerations

### 10.1 Access Control
- Job creation permissions
- Job status visibility
- Admin-only management endpoints
- User isolation for job data

### 10.2 Data Protection
- Secure payload storage
- Sensitive data handling
- Audit logging
- Error message sanitization

### 10.3 Resource Protection
- Job execution timeouts
- Memory usage limits
- CPU usage monitoring
- Rate limiting for job creation

## 11. Future Enhancements

### 11.1 Advanced Features
- Job dependencies and workflows
- Batch job processing
- Job result caching
- Queue partitioning
- Multi-tenant support

### 11.2 Scalability
- Distributed job processing
- Redis-based job storage
- Horizontal worker scaling
- Load balancing strategies
- Cross-region job distribution

### 11.3 Monitoring Enhancements
- Real-time dashboards
- Alert systems
- Performance analytics
- Resource usage tracking
- Custom metrics

## 12. Success Metrics

### 12.1 Performance Metrics
- Job completion rate: >99%
- Average job execution time: <5 seconds
- Queue processing lag: <10 seconds
- Worker utilization: 70-90%
- System resource usage: <50%

### 12.2 Reliability Metrics
- Job failure rate: <1%
- System uptime: >99.9%
- Data consistency: 100%
- Recovery time: <5 minutes
- Error handling coverage: 100%

### 12.3 Developer Experience
- Job creation simplicity
- Clear error messages
- Comprehensive documentation
- Easy debugging
- Fast development cycle

## 13. Risks and Mitigation

### 13.1 Technical Risks
- **Database performance**: Implement proper indexing and query optimization
- **Memory leaks**: Regular monitoring and proper resource cleanup
- **Deadlocks**: Implement proper locking strategies
- **Infinite loops**: Job timeouts and circuit breakers

### 13.2 Operational Risks
- **Job queue overflow**: Implement queue size limits and alerts
- **Worker failures**: Automatic restart and health checks
- **Data loss**: Proper backup and recovery procedures
- **Performance degradation**: Monitoring and alerting systems

## 14. Conclusion

This PRD outlines a comprehensive background job queue system that will provide reliable, scalable, and maintainable job processing capabilities for the dashboard template. The implementation follows the existing architectural patterns and integrates seamlessly with the current tech stack.

The system is designed to be:
- **Simple to use**: Clear APIs and examples
- **Reliable**: Robust error handling and retry mechanisms
- **Scalable**: Designed for future horizontal scaling
- **Maintainable**: Clean architecture and comprehensive testing
- **Observable**: Built-in monitoring and logging

The phased implementation approach ensures steady progress while maintaining system stability and allows for iterative improvements based on real-world usage patterns.
