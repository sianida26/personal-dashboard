# Environment & Configuration

This document covers environment variables, configuration management, and application settings.

## Environment Variables

### Required Variables

```bash
# Application Configuration
APP_ENV=development                    # Application environment (development, production)
APP_HOST=127.0.0.1                    # Host to bind the server to
APP_PORT=3000                         # Port to run the server on
BASE_URL=http://localhost:3000        # Base URL for the backend API
FRONTEND_URL=http://localhost:5173    # Frontend application URL

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname  # PostgreSQL connection string

# JWT Configuration
PRIVATE_KEY_PATH=private_key.pem      # Path to RSA private key for JWT signing
PUBLIC_KEY_PATH=public_key.pem        # Path to RSA public key for JWT verification
```

### Optional Variables

```bash
# Logging Controls
LOG_ERROR=true          # Enable error logging
LOG_INFO=true           # Enable info logging
LOG_DEBUG=false         # Enable debug logging (recommended false in production)
LOG_REQUEST=true        # Enable request logging
LOG_SQL=true            # Enable SQL query logging

# OAuth Configuration (if using OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

## Environment Configuration

### appEnv.ts Structure

```typescript
// src/appEnv.ts
import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_HOST: z.string().default("127.0.0.1"),
  APP_PORT: z.coerce.number().default(3000),
  BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  PRIVATE_KEY_PATH: z.string(),
  PUBLIC_KEY_PATH: z.string(),
  LOG_ERROR: z.coerce.boolean().default(true),
  LOG_INFO: z.coerce.boolean().default(true),
  LOG_DEBUG: z.coerce.boolean().default(false),
  LOG_REQUEST: z.coerce.boolean().default(true),
  LOG_SQL: z.coerce.boolean().default(true),
});

const appEnv = envSchema.parse(process.env);

export default appEnv;
```

### Usage in Code

```typescript
import appEnv from "../appEnv";

// Use configuration values
const server = serve({
  port: appEnv.APP_PORT,
  hostname: appEnv.APP_HOST,
});

// Environment-specific behavior
if (appEnv.APP_ENV === "development") {
  console.log("Running in development mode");
}
```

## Environment Files

### Development Environment
```bash
# .env.development
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/dashboard_dev
LOG_DEBUG=true
LOG_SQL=true
```

### Production Environment
```bash
# .env.production
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=3000
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/dashboard_prod
LOG_DEBUG=false
LOG_SQL=false
```

### Test Environment
```bash
# .env.test
APP_ENV=test
APP_HOST=127.0.0.1
APP_PORT=3001
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5174
DATABASE_URL=postgresql://user:pass@localhost:5432/dashboard_test
LOG_DEBUG=true
LOG_SQL=true
```

## Dynamic App Settings

### App Settings System
Dynamic configuration stored in the `app_settings` table:

```typescript
// Get setting
const value = await getAppSettingValue("SETTING_KEY");

// Set setting (through API)
POST /app-settings
{
  "key": "SETTING_KEY",
  "value": "SETTING_VALUE"
}
```

### Common App Settings

```typescript
// System settings
await setAppSetting("SYSTEM_MAINTENANCE_MODE", "false");
await setAppSetting("MAX_USERS_PER_ORGANIZATION", "100");
await setAppSetting("FEATURE_FLAG_NEW_DASHBOARD", "true");

// Email settings
await setAppSetting("SMTP_HOST", "smtp.gmail.com");
await setAppSetting("SMTP_PORT", "587");
await setAppSetting("EMAIL_FROM", "noreply@yourdomain.com");

// UI settings
await setAppSetting("SIDEBAR_DEFAULT_COLLAPSED", "false");
await setAppSetting("THEME_DEFAULT", "light");
```

### Using App Settings

```typescript
// In route handlers
const isMaintenanceMode = await getAppSettingValue("SYSTEM_MAINTENANCE_MODE");
if (isMaintenanceMode === "true") {
  throw serviceUnavailable({ message: "System is under maintenance" });
}

// In services
export class EmailService {
  async sendEmail() {
    const smtpHost = await getAppSettingValue("SMTP_HOST");
    const smtpPort = await getAppSettingValue("SMTP_PORT");
    // Use settings...
  }
}
```

## Configuration Validation

### Environment Validation
```typescript
// Validate required environment variables at startup
const validateEnvironment = () => {
  const required = [
    "DATABASE_URL",
    "PRIVATE_KEY_PATH",
    "PUBLIC_KEY_PATH",
    "BASE_URL",
    "FRONTEND_URL"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};

// Call during application startup
validateEnvironment();
```

### Configuration Health Check
```typescript
// GET /health endpoint
const healthCheckEndpoint = createHonoRoute()
  .get("/health", async (c) => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: appEnv.APP_ENV,
      database: "connected", // Check database connection
      redis: "connected",    // Check Redis connection (if applicable)
    };

    return c.json(health);
  });
```

## Security Configuration

### JWT Key Management
```typescript
// Generate RSA key pair (run once)
const generateKeys = async () => {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  // Export keys to PEM format
  // Save to private_key.pem and public_key.pem
};
```

### CORS Configuration
```typescript
// Configure CORS based on environment
const corsOptions = {
  origin: appEnv.APP_ENV === "production" 
    ? [appEnv.FRONTEND_URL] 
    : "*",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
```

## Environment-Specific Behaviors

### Development Features
```typescript
if (appEnv.APP_ENV === "development") {
  // Enable detailed error responses
  app.use(async (c, next) => {
    try {
      await next();
    } catch (error) {
      return c.json({
        error: error.message,
        stack: error.stack, // Only in development
      }, 500);
    }
  });

  // Enable request logging
  app.use(detailedRequestLogger);
}
```

### Production Optimizations
```typescript
if (appEnv.APP_ENV === "production") {
  // Enable compression
  app.use(compress());

  // Security headers
  app.use(securityHeaders);

  // Rate limiting
  app.use(strictRateLimit);
}
```

## Configuration Management

### Loading Configuration
```typescript
// Load configuration in order of precedence
const loadConfig = () => {
  // 1. Default values
  const config = { ...defaultConfig };

  // 2. Environment file
  if (fs.existsSync('.env')) {
    const envFile = dotenv.parse(fs.readFileSync('.env'));
    Object.assign(config, envFile);
  }

  // 3. Environment variables
  Object.assign(config, process.env);

  // 4. Command line arguments
  // Parse CLI args if needed

  return config;
};
```

### Configuration Caching
```typescript
// Cache frequently accessed settings
const settingsCache = new Map<string, string>();

export const getCachedSetting = async (key: string) => {
  if (settingsCache.has(key)) {
    return settingsCache.get(key);
  }

  const value = await getAppSettingValue(key);
  settingsCache.set(key, value);
  
  // Cache for 5 minutes
  setTimeout(() => settingsCache.delete(key), 5 * 60 * 1000);
  
  return value;
};
```

## Best Practices

### Environment Variables
- Use descriptive names with consistent prefixes
- Validate required variables at startup
- Use appropriate data types (string, number, boolean, URL)
- Document all environment variables
- Use secrets management for sensitive values

### Configuration Management
- Keep configuration separate from code
- Use environment-specific configuration files
- Implement configuration validation
- Cache frequently accessed settings
- Provide sensible defaults

### Security
- Never commit sensitive values to version control
- Use environment variables for secrets
- Rotate keys and tokens regularly
- Implement proper access controls for configuration
- Monitor configuration changes

## Related Documentation

- [Architecture Overview](architecture.md) - System configuration
- [Security](security.md) - Security configuration
- [Common Development Tasks](development-tasks.md#8-adding-environment-variable) - Adding new variables
- [Troubleshooting](troubleshooting.md) - Configuration issues
