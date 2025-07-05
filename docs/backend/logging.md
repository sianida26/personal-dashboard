# Logging & Debugging

This document covers logging patterns, debugging techniques, and log management in the backend.

## Logger Usage

### Basic Logging
```typescript
import appLogger from "../utils/logger";

// In route handlers
appLogger.info("User created successfully", c);
appLogger.error("Failed to create user", c);
appLogger.debug("Debug information", c);
appLogger.sql("SELECT * FROM users", ["param1", "param2"]);

// Error logging (automatic in error handler)
appLogger.error(error, c);
```

### Logger Methods

#### Info Logging
```typescript
// Log successful operations
appLogger.info("User logged in successfully", c);
appLogger.info("Database migration completed", c);
appLogger.info("Email sent to user", c);
```

#### Error Logging
```typescript
// Log errors with context
appLogger.error("Database connection failed", c);
appLogger.error("Authentication failed", c);
appLogger.error(error, c); // Log error object
```

#### Debug Logging
```typescript
// Log detailed debugging information
appLogger.debug("Processing user data", c);
appLogger.debug("Validation passed", c);
appLogger.debug("Cache miss for key: user_123", c);
```

#### SQL Logging
```typescript
// Log SQL queries and parameters
appLogger.sql("SELECT * FROM users WHERE id = $1", [userId]);
appLogger.sql("INSERT INTO users (name, email) VALUES ($1, $2)", [name, email]);
```

## Log Files

The logger automatically creates daily log files in the `logs/` directory:

- **`logs/YYYYMMDD-access.log`** - HTTP requests and responses
- **`logs/YYYYMMDD-error.log`** - Error messages and stack traces
- **`logs/YYYYMMDD-info.log`** - General information messages
- **`logs/YYYYMMDD-debug.log`** - Debug information (only in development)
- **`logs/YYYYMMDD-sql.log`** - SQL queries and parameters

### Log File Format
```
[2024-01-15T10:30:45.123Z] [INFO] [req-123] User created successfully
[2024-01-15T10:30:46.456Z] [ERROR] [req-124] Database connection failed
[2024-01-15T10:30:47.789Z] [DEBUG] [req-125] Processing user data
```

## Logging in Different Contexts

### Route Handler Logging
```typescript
const getUsersEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/users", async (c) => {
    appLogger.info("Fetching users list", c);
    
    try {
      const users = await db.query.users.findMany();
      appLogger.info(`Found ${users.length} users`, c);
      return c.json({ data: users });
    } catch (error) {
      appLogger.error("Failed to fetch users", c);
      throw error;
    }
  });
```

### Service Layer Logging
```typescript
export class UserService {
  async createUser(userData: CreateUserType) {
    appLogger.info(`Creating user: ${userData.email}`);
    
    try {
      const user = await db.insert(users).values(userData).returning();
      appLogger.info(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      appLogger.error(`Failed to create user: ${userData.email}`, error);
      throw error;
    }
  }
}
```

### Database Operation Logging
```typescript
const getUserWithRoles = async (userId: string) => {
  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u 
    LEFT JOIN roles_to_users rtu ON u.id = rtu.user_id 
    LEFT JOIN roles r ON rtu.role_id = r.id 
    WHERE u.id = $1
  `;
  
  appLogger.sql(query, [userId]);
  
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      rolesToUsers: {
        with: {
          role: true
        }
      }
    }
  });
  
  return result;
};
```

## Request Logging

### Automatic Request Logging
The `requestLogger` middleware automatically logs:
- HTTP method and path
- Request timestamp
- Response status code
- Response time
- User agent
- IP address

### Custom Request Context
```typescript
const myEndpoint = createHonoRoute()
  .get("/my-endpoint", async (c) => {
    const requestId = c.var.requestId;
    appLogger.info(`Processing request ${requestId}`, c);
    
    // Your logic here
    
    appLogger.info(`Request ${requestId} completed`, c);
    return c.json({ success: true });
  });
```

## Error Logging

### Automatic Error Handling
The global error handler automatically logs all errors:

```typescript
app.onError((error, c) => {
  appLogger.error(`Unhandled error: ${error.message}`, c);
  appLogger.error(error.stack, c);
  
  // Return appropriate error response
  return c.json({ error: "Internal server error" }, 500);
});
```

### Custom Error Logging
```typescript
const myEndpoint = createHonoRoute()
  .get("/my-endpoint", async (c) => {
    try {
      // Your logic here
    } catch (error) {
      appLogger.error("Specific error occurred", c);
      appLogger.error(error, c);
      
      // Re-throw to let global handler manage response
      throw error;
    }
  });
```

## Environment-Based Logging

### Log Level Configuration
```typescript
// src/appEnv.ts
const appEnv = {
  LOG_ERROR: process.env.LOG_ERROR === "true",
  LOG_INFO: process.env.LOG_INFO === "true",
  LOG_DEBUG: process.env.LOG_DEBUG === "true",
  LOG_REQUEST: process.env.LOG_REQUEST === "true",
  LOG_SQL: process.env.LOG_SQL === "true",
};
```

### Environment-Specific Behavior
```typescript
// Development: All logs enabled
LOG_ERROR=true
LOG_INFO=true
LOG_DEBUG=true
LOG_REQUEST=true
LOG_SQL=true

// Production: Only errors and info
LOG_ERROR=true
LOG_INFO=true
LOG_DEBUG=false
LOG_REQUEST=true
LOG_SQL=false
```

## Debugging Techniques

### Request Tracing
```typescript
const complexEndpoint = createHonoRoute()
  .post("/complex-operation", async (c) => {
    const requestId = c.var.requestId;
    appLogger.debug(`[${requestId}] Starting complex operation`, c);
    
    // Step 1
    appLogger.debug(`[${requestId}] Validating input`, c);
    const data = c.req.valid("json");
    
    // Step 2
    appLogger.debug(`[${requestId}] Checking permissions`, c);
    // Permission check logic
    
    // Step 3
    appLogger.debug(`[${requestId}] Processing data`, c);
    // Data processing logic
    
    appLogger.debug(`[${requestId}] Complex operation completed`, c);
    return c.json({ success: true });
  });
```

### Performance Logging
```typescript
const performanceEndpoint = createHonoRoute()
  .get("/performance-test", async (c) => {
    const start = Date.now();
    
    try {
      // Your operation
      const result = await expensiveOperation();
      
      const duration = Date.now() - start;
      appLogger.info(`Operation completed in ${duration}ms`, c);
      
      return c.json({ result });
    } catch (error) {
      const duration = Date.now() - start;
      appLogger.error(`Operation failed after ${duration}ms`, c);
      throw error;
    }
  });
```

### Data Debugging
```typescript
const debugEndpoint = createHonoRoute()
  .post("/debug-data", async (c) => {
    const inputData = c.req.valid("json");
    
    appLogger.debug("Input data:", c);
    appLogger.debug(JSON.stringify(inputData, null, 2), c);
    
    const processedData = await processData(inputData);
    
    appLogger.debug("Processed data:", c);
    appLogger.debug(JSON.stringify(processedData, null, 2), c);
    
    return c.json({ data: processedData });
  });
```

## Log Analysis

### Viewing Logs
```bash
# View recent logs
tail -f logs/$(date +%Y%m%d)-info.log

# View error logs
tail -f logs/$(date +%Y%m%d)-error.log

# Search for specific patterns
grep "User created" logs/$(date +%Y%m%d)-info.log

# View SQL queries
tail -f logs/$(date +%Y%m%d)-sql.log
```

### Log Rotation
Logs are automatically rotated daily. Old logs are kept for debugging purposes.

### Log Monitoring
Consider implementing log monitoring for production:
- Error rate monitoring
- Performance metrics
- Security event detection
- Automated alerting

## Security Considerations

### Sensitive Data
```typescript
// ❌ DON'T log sensitive data
appLogger.info(`User password: ${password}`, c); // NEVER!
appLogger.info(`JWT token: ${token}`, c); // NEVER!

// ✅ DO log safely
appLogger.info(`User logged in: ${user.email}`, c);
appLogger.info(`Token issued for user: ${user.id}`, c);
```

### Log Sanitization
```typescript
const sanitizeForLogging = (data: any) => {
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  return sanitized;
};

appLogger.info("User data:", c);
appLogger.info(JSON.stringify(sanitizeForLogging(userData), null, 2), c);
```

## Best Practices

### Do's
- Log at appropriate levels (info, error, debug)
- Include context information (user ID, request ID)
- Log both success and failure cases
- Use structured logging when possible
- Include timing information for performance debugging

### Don'ts
- Don't log sensitive information (passwords, tokens)
- Don't log in tight loops (use sampling)
- Don't log excessively in production
- Don't forget to include error context
- Don't use console.log in production code

## Troubleshooting Common Issues

### Missing Logs
1. Check log level configuration
2. Verify log directory permissions
3. Ensure logger is properly imported
4. Check if log files are being created

### Performance Impact
1. Reduce debug logging in production
2. Use asynchronous logging
3. Implement log sampling for high-volume endpoints
4. Monitor log file sizes

### Log File Management
1. Implement log rotation
2. Archive old logs
3. Monitor disk space
4. Set up log cleanup policies

## Related Documentation

- [Architecture](architecture.md) - System overview and design patterns
- [Testing](testing.md) - Testing with logs
- [Troubleshooting](troubleshooting.md) - Using logs for debugging
- [Best Practices](best-practices.md) - Logging best practices
