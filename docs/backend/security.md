# Security Considerations

This document covers security best practices and considerations for the backend application.

## Authentication Security

### JWT Token Security
- **Algorithm**: Use RSA256 (RS256) for token signing
- **Key Management**: Store private keys securely, rotate regularly
- **Expiration**: Set appropriate token expiration times (1 hour for access tokens)
- **Refresh Tokens**: Implement secure refresh token mechanism
- **Token Storage**: Never store tokens in localStorage on client side

### Token Implementation
```typescript
// Generate access token
const accessToken = jwt.sign(
  { uid: user.id },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

// Validate token
const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

### Rate Limiting on Auth Endpoints

The application implements specialized rate limiting for different authentication endpoints to prevent brute force attacks and abuse:

```typescript
// Authentication login rate limit - 5 requests per 15 minutes
const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 requests per window per IP
  message: "Too many login attempts. Please try again later.",
};

// OAuth rate limit - 10 requests per 5 minutes
const oauthRateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10, // 10 requests per window per IP
  message: "Too many OAuth attempts. Please try again later.",
};

// Token refresh rate limit - 10 requests per 5 minutes
const refreshRateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10, // 10 requests per window per IP
  message: "Too many token refresh attempts. Please try again later.",
};

// Registration rate limit - 3 requests per hour
const registerRateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 requests per window per IP
  message: "Too many registration attempts. Please try again later.",
};
```

**Rate Limit Configuration by Endpoint:**

| Endpoint            | Limit       | Window     | Purpose                                 |
| ------------------- | ----------- | ---------- | --------------------------------------- |
| `/auth/login`       | 5 requests  | 15 minutes | Prevent brute force password attacks    |
| `/auth/google/*`    | 10 requests | 5 minutes  | Prevent OAuth abuse                     |
| `/auth/microsoft/*` | 10 requests | 5 minutes  | Prevent OAuth abuse                     |
| `/auth/refresh`     | 10 requests | 5 minutes  | Prevent token refresh abuse             |
| `/auth/register`    | 3 requests  | 1 hour     | Prevent account spam (when implemented) |

**Key Features:**
- Rate limits are per IP address
- Returns `429 Too Many Requests` status when exceeded
- Includes `Retry-After` header with retry time
- Automatically skipped in test environment (unless `x-enable-rate-limit` header is set)
- Uses Cloudflare/forwarded IP detection for accurate client identification

### Password Security
- **Hashing**: Use bcrypt with appropriate salt rounds
- **Complexity**: Implement password complexity requirements
- **History**: Consider password history to prevent reuse
- **Reset**: Secure password reset mechanism with time-limited tokens

```typescript
// Password hashing
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password validation
const validatePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

## Authorization Security

### Permission-Based Access Control
```typescript
// Always check permissions at route level
const protectedEndpoint = createHonoRoute()
  .use(authInfo)
  .get("/protected", checkPermission("resource.read"), async (c) => {
    // Route logic
  });
```

### Route-Level Permission Checking
```typescript
// Single permission
checkPermission("users.read")

// Multiple permissions (user needs any one)
protect(["users.read", "users.readAll"])

// Custom permission logic
const customPermissionCheck = createMiddleware<HonoEnv>(async (c, next) => {
  const currentUser = c.var.currentUser;
  if (!currentUser?.permissions.includes("admin.access")) {
    throw forbidden({ message: "Admin access required" });
  }
  await next();
});
```

### User Role Inheritance
- Users inherit permissions from roles
- Direct permissions override role permissions
- Implement principle of least privilege
- Regular permission audits

### Soft Delete for Sensitive Data
```typescript
// Soft delete implementation
const softDeleteUser = async (userId: string) => {
  await db.update(users)
    .set({
      deletedAt: new Date(),
      isEnabled: false
    })
    .where(eq(users.id, userId));
};
```

## Input Validation Security

### Zod Schema Validation
```typescript
// Comprehensive validation
const userSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character")
});
```

### SQL Injection Prevention
```typescript
// ✅ Safe - Using Drizzle ORM
const user = await db.query.users.findFirst({
  where: eq(users.email, email)
});

// ❌ Unsafe - Raw SQL without parameters
const user = await db.execute(`SELECT * FROM users WHERE email = '${email}'`);
```

### XSS Protection
```typescript
// Sanitize output
const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};
```

## CORS Configuration

### Environment-Based CORS
```typescript
const corsConfig = {
  origin: appEnv.APP_ENV === "production"
    ? [appEnv.FRONTEND_URL]
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
```

## Data Protection

### Sensitive Data Handling
```typescript
// ❌ Never log sensitive data
appLogger.info(`User password: ${password}`); // NEVER!

// ✅ Log safely
appLogger.info(`User authenticated: ${user.id}`);
```

### Data Encryption
```typescript
// Encrypt sensitive data at rest
const encryptSensitiveData = (data: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
```

### Database Security
- Use connection pooling
- Implement database-level constraints
- Regular security updates
- Backup encryption
- Access logging

## Environment Security

### Environment Variables
```typescript
// ✅ Secure environment variable handling
const secureEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};

// Validate required secrets exist
if (!secureEnv.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
```

### Secrets Management
- Use external secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Never commit secrets to version control
- Use different secrets for different environments

## API Security

### Request Validation
```typescript
// Validate all request inputs
const secureEndpoint = createHonoRoute()
  .post("/secure",
    requestValidator("json", secureSchema),
    async (c) => {
      const data = c.req.valid("json");
      // Process validated data
    }
  );
```

### Response Security
```typescript
// Sanitize response data
const sanitizeUser = (user: User) => {
  const { password, ...safeUser } = user;
  return safeUser;
};
```

### Security Headers
```typescript
// Add security headers
const securityHeaders = createMiddleware(async (c, next) => {
  await next();

  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});
```

## OAuth Security

### Google OAuth Implementation
```typescript
const googleOAuth = createHonoRoute()
  .get("/auth/google", async (c) => {
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Store state and nonce securely
    await storeOAuthState(state, nonce);

    const authUrl = buildGoogleAuthUrl(state, nonce);
    return c.redirect(authUrl);
  });
```

### OAuth Callback Security
```typescript
const googleCallback = createHonoRoute()
  .get("/auth/google/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");

    // Verify state parameter
    const isValidState = await verifyOAuthState(state);
    if (!isValidState) {
      throw badRequest({ message: "Invalid OAuth state" });
    }

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code);

    // Validate and create user
    const user = await createOrUpdateGoogleUser(tokens);

    return c.json({ accessToken: generateJWT(user.id) });
  });
```

## Monitoring and Auditing

### Security Event Logging
```typescript
// Log security events
const logSecurityEvent = (event: string, details: any, c: Context) => {
  appLogger.info(`SECURITY: ${event}`, c);
  appLogger.info(`Details: ${JSON.stringify(details)}`, c);
};

// Usage
logSecurityEvent("LOGIN_ATTEMPT", { email: user.email, success: true }, c);
logSecurityEvent("PERMISSION_DENIED", { userId: user.id, permission: "admin.access" }, c);
```

### Failed Authentication Tracking
```typescript
// Track failed login attempts
const trackFailedLogin = async (email: string, ip: string) => {
  await db.insert(failedLogins).values({
    email,
    ipAddress: ip,
    timestamp: new Date()
  });

  // Check for brute force attempts
  const recentFailures = await db.query.failedLogins.findMany({
    where: and(
      eq(failedLogins.email, email),
      gte(failedLogins.timestamp, new Date(Date.now() - 15 * 60 * 1000))
    )
  });

  if (recentFailures.length >= 5) {
    // Lock account or increase delay
    await lockAccount(email);
  }
};
```

## Security Best Practices

### Development Practices
- Regular security code reviews
- Static analysis tools
- Dependency vulnerability scanning
- Security testing
- Penetration testing

### Deployment Security
- Use HTTPS in production
- Implement proper firewall rules
- Regular security updates
- Monitor for suspicious activity
- Backup and disaster recovery

### Incident Response
- Security incident response plan
- Logging and monitoring
- Automated alerting
- Regular security audits
- Documentation and training

## Common Security Vulnerabilities

### Prevention Checklist
- [ ] SQL Injection - Use parameterized queries
- [ ] XSS - Sanitize inputs and outputs
- [ ] CSRF - Implement CSRF tokens
- [ ] Insecure Direct Object References - Validate access
- [ ] Security Misconfiguration - Review configurations
- [ ] Sensitive Data Exposure - Encrypt at rest and in transit
- [ ] Insufficient Access Controls - Implement proper authorization
- [ ] Injection Attacks - Validate and sanitize inputs
- [ ] Broken Authentication - Implement secure authentication
- [ ] Insufficient Logging - Monitor security events

## Related Documentation

- [Authentication & Authorization](auth.md) - Implementation details
- [Architecture](architecture.md) - System overview and design patterns
- [Testing](testing.md) - Security testing
- [Best Practices](best-practices.md) - Security coding practices
