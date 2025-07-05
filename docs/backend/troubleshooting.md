# Troubleshooting

This document provides solutions to common issues and debugging techniques for the backend.

## Common Issues

### 1. Database Connection Issues

#### Symptoms
- "Connection refused" errors
- "Database does not exist" errors
- Migration failures

#### Solutions
1. **Check DATABASE_URL environment variable**
   ```bash
   echo $DATABASE_URL
   # Should output: postgresql://user:pass@localhost:5432/dbname
   ```

2. **Verify PostgreSQL is running**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Start PostgreSQL if not running
   sudo systemctl start postgresql
   ```

3. **Verify database credentials**
   ```bash
   # Test connection manually
   psql $DATABASE_URL
   ```

4. **Check database exists**
   ```sql
   -- Connect to PostgreSQL and list databases
   \l
   
   -- Create database if it doesn't exist
   CREATE DATABASE dashboard_dev;
   ```

### 2. Permission Errors

#### Symptoms
- 403 Forbidden responses
- "Insufficient permissions" errors
- Users can't access protected routes

#### Solutions
1. **Check if user has required permissions**
   ```typescript
   // Debug user permissions
   const user = await db.query.users.findFirst({
     where: eq(users.id, userId),
     with: {
       rolesToUsers: {
         with: { role: { with: { permissionsToRoles: { with: { permission: true } } } } }
       },
       permissionsToUsers: { with: { permission: true } }
     }
   });
   
   console.log("User permissions:", user?.permissions);
   ```

2. **Verify permission is defined in database**
   ```sql
   SELECT * FROM permissions WHERE code = 'users.read';
   ```

3. **Ensure authInfo middleware is used**
   ```typescript
   // ✅ Correct - authInfo before permission check
   const endpoint = createHonoRoute()
     .use(authInfo)
     .get("/protected", checkPermission("resource.read"), async (c) => {
       // Route logic
     });
   ```

4. **Check role assignments**
   ```sql
   -- Check user's roles
   SELECT u.name, r.name as role_name 
   FROM users u
   JOIN roles_to_users rtu ON u.id = rtu.user_id
   JOIN roles r ON rtu.role_id = r.id
   WHERE u.id = 'user_id_here';
   ```

### 3. Type Errors

#### Symptoms
- TypeScript compilation errors
- "Property does not exist" errors
- Type inference issues

#### Solutions
1. **Ensure schemas are properly imported in drizzle/index.ts**
   ```typescript
   // src/drizzle/index.ts
   import * as usersSchema from "./schema/users";
   import * as rolesSchema from "./schema/roles";
   
   const db = drizzle({
     schema: {
       ...usersSchema,
       ...rolesSchema,
       // All schemas must be imported here
     },
   });
   ```

2. **Check TypeScript configuration**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

3. **Verify Zod schema definitions**
   ```typescript
   // Make sure schemas are properly exported from validation package
   import { userFormSchema } from "@repo/validation";
   ```

### 4. Migration Issues

#### Symptoms
- Migration generation fails
- Migration application fails
- Schema drift errors

#### Solutions
1. **Never edit migration files directly**
   - Always modify schema files
   - Generate new migrations with `bun db:generate`

2. **Check schema file syntax**
   ```typescript
   // Ensure proper imports and exports
   export const myTableSchema = pgTable("my_table", {
     // Schema definition
   });
   
   export const myTableRelations = relations(myTableSchema, ({ many }) => ({
     // Relations definition
   }));
   ```

3. **Reset migrations (development only)**
   ```bash
   # WARNING: This will delete all data
   bun db:reset
   bun db:migrate
   bun db:seed
   ```

4. **Check Drizzle configuration**
   ```typescript
   // drizzle.config.ts
   export default {
     schema: "./src/drizzle/schema/*",
     out: "./src/drizzle/migrations",
     driver: "pg",
     dbCredentials: {
       connectionString: process.env.DATABASE_URL!,
     },
   };
   ```

### 5. Test Interference Issues (Bun-specific)

#### Symptoms
- Previously passing tests suddenly fail when running full test suite
- Mocks from one test file affecting completely unrelated tests
- Unpredictable test behavior

#### Solutions
1. **Check for global mocks**
   ```bash
   # Search for mock.module usage
   grep -r "mock.module" src/
   ```

2. **Use spyOn instead of mock.module**
   ```typescript
   // ❌ DON'T - Global mock
   mock.module("../../utils/some-util", () => ({
     someFunction: mock(() => "mocked")
   }));
   
   // ✅ DO - Isolated spy
   import * as someUtil from "../../utils/some-util";
   const spy = spyOn(someUtil, "someFunction").mockReturnValue("mocked");
   ```

3. **Always restore mocks**
   ```typescript
   describe("Test Suite", () => {
     afterEach(() => {
       jest.restoreAllMocks?.();
       vi?.restoreAllMocks?.();
     });
   });
   ```

4. **Run tests individually vs together**
   ```bash
   # Run individual test file
   bun test src/routes/users/get-users.test.ts
   
   # Run all tests
   bun run test
   ```

### 6. Environment Variable Issues in Tests

#### Symptoms
- Environment overrides not working in tests
- Tests failing due to missing environment variables

#### Solutions
1. **Use Object.defineProperty for environment overrides**
   ```typescript
   // ✅ Correct way to override environment variables
   describe("Environment Tests", () => {
     const originalValue = appEnv.SOME_SETTING;
     
     afterEach(() => {
       Object.defineProperty(appEnv, "SOME_SETTING", {
         value: originalValue,
         writable: true,
         configurable: true
       });
     });
   
     test("should work with modified environment", () => {
       Object.defineProperty(appEnv, "SOME_SETTING", {
         value: "test-value",
         writable: true,
         configurable: true
       });
       
       // Test logic
     });
   });
   ```

2. **Restore original values**
   ```typescript
   afterAll(() => {
     // Restore all environment variables
     process.env.NODE_ENV = originalNodeEnv;
     process.env.DATABASE_URL = originalDatabaseUrl;
   });
   ```

## Test Debugging Checklist

When tests are failing unexpectedly:

1. **Check for global mocks**
   ```bash
   # Search for problematic patterns
   grep -r "mock.module" src/
   grep -r "jest.mock" src/
   ```

2. **Run tests individually vs together**
   ```bash
   # Run single test file
   bun test src/specific-test.test.ts
   
   # Run all tests
   bun run test
   
   # Compare results
   ```

3. **Look for missing mock cleanup**
   ```typescript
   // Check all test files have proper cleanup
   afterEach(() => {
     jest.restoreAllMocks?.();
   });
   ```

4. **Check environment variable restoration**
   ```typescript
   // Ensure environment variables are restored
   afterEach(() => {
     // Restore environment variables
   });
   ```

5. **Verify test isolation**
   - Tests should not depend on each other
   - Each test should set up its own data
   - Clean up after each test

## Performance Issues

### 1. Slow Database Queries

#### Symptoms
- High response times
- Database timeouts
- High CPU usage

#### Solutions
1. **Add database indexes**
   ```sql
   -- Add index for frequently queried columns
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_created_at ON users(created_at);
   ```

2. **Optimize queries**
   ```typescript
   // ❌ N+1 query problem
   const users = await db.query.users.findMany();
   for (const user of users) {
     const roles = await db.query.rolesToUsers.findMany({
       where: eq(rolesToUsers.userId, user.id)
     });
   }
   
   // ✅ Use relations to fetch in single query
   const users = await db.query.users.findMany({
     with: {
       rolesToUsers: {
         with: { role: true }
       }
     }
   });
   ```

3. **Implement pagination**
   ```typescript
   // Always use pagination for large datasets
   const users = await db.query.users.findMany({
     limit: 20,
     offset: (page - 1) * 20
   });
   ```

### 2. Memory Leaks

#### Symptoms
- Increasing memory usage over time
- Server crashes with out-of-memory errors

#### Solutions
1. **Check for unclosed database connections**
2. **Implement proper cleanup in middleware**
3. **Use connection pooling**
4. **Monitor memory usage**

## Logging Issues

### 1. Missing Logs

#### Symptoms
- No log files being created
- Missing log entries

#### Solutions
1. **Check log level configuration**
   ```bash
   # Verify log environment variables
   echo $LOG_ERROR
   echo $LOG_INFO
   echo $LOG_DEBUG
   ```

2. **Verify log directory permissions**
   ```bash
   # Check if logs directory is writable
   ls -la logs/
   ```

3. **Ensure logger is properly imported**
   ```typescript
   import appLogger from "../utils/logger";
   
   // Use logger methods
   appLogger.info("Message", c);
   ```

### 2. Log File Size Issues

#### Symptoms
- Large log files consuming disk space
- Performance degradation

#### Solutions
1. **Implement log rotation**
2. **Archive old logs**
3. **Monitor disk space**
4. **Adjust log levels in production**

## Security Issues

### 1. JWT Token Problems

#### Symptoms
- "Invalid token" errors
- Token verification failures

#### Solutions
1. **Check private/public key files**
   ```bash
   # Verify key files exist and are readable
   ls -la private_key.pem public_key.pem
   ```

2. **Verify token format**
   ```typescript
   // Check token is properly formatted
   const token = c.req.header("authorization")?.replace("Bearer ", "");
   ```

3. **Check token expiration**
   ```typescript
   // Debug token payload
   try {
     const payload = jwt.verify(token, publicKey);
     console.log("Token payload:", payload);
   } catch (error) {
     console.error("Token verification failed:", error);
   }
   ```

### 2. CORS Issues

#### Symptoms
- "CORS policy" errors in browser
- Failed preflight requests

#### Solutions
1. **Check CORS configuration**
   ```typescript
   // Verify CORS settings
   const corsConfig = {
     origin: appEnv.FRONTEND_URL,
     credentials: true,
     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
   };
   ```

2. **Handle preflight requests**
   ```typescript
   // Ensure OPTIONS requests are handled
   app.options("*", (c) => c.text("OK"));
   ```

## Development Issues

### 1. Hot Reload Not Working

#### Symptoms
- Changes not reflected without restart
- Bun dev not detecting file changes

#### Solutions
1. **Check file watch patterns**
2. **Restart development server**
3. **Check for syntax errors**

### 2. Import/Export Issues

#### Symptoms
- "Module not found" errors
- Import resolution failures

#### Solutions
1. **Check file paths**
2. **Verify export statements**
3. **Check TypeScript configuration**

## Getting Help

### Debug Information to Collect
1. **Error messages and stack traces**
2. **Environment configuration**
3. **Database state**
4. **Log files**
5. **Steps to reproduce**

### Useful Commands for Debugging
```bash
# Check application status
bun dev

# Check database connection
psql $DATABASE_URL

# View recent logs
tail -f logs/$(date +%Y%m%d)-error.log

# Check environment variables
env | grep -E "(APP_|DATABASE_|LOG_)"

# Run specific test
bun test --verbose src/specific.test.ts
```

## Related Documentation

- [Testing](testing.md) - Testing best practices and patterns
- [Database Layer](database.md) - Database troubleshooting
- [Architecture](architecture.md) - System overview and design patterns
- [Security](security.md) - Security-related problems
