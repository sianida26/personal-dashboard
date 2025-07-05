# API Documentation

This document covers API response formats, query parameters, and standards for the backend API.

## Standard Response Format

### Success Response
```typescript
{
  "data": [...],           // The requested data
  "_metadata": {           // Optional metadata for pagination/context
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1
  }
}
```

### Error Response
```typescript
{
  "message": "Error description",     // Human-readable error message
  "errorCode": "ERROR_CODE",          // Machine-readable error code
  "formErrors": {                     // Field-specific validation errors
    "field": "Field-specific error"
  }
}
```

## Response Examples

### Successful Data Retrieval
```typescript
// GET /users
{
  "data": [
    {
      "id": "cm123456789",
      "name": "John Doe",
      "email": "john@example.com",
      "isEnabled": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "_metadata": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### Successful Resource Creation
```typescript
// POST /users
{
  "data": {
    "id": "cm123456789",
    "name": "John Doe",
    "email": "john@example.com",
    "isEnabled": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Validation Error Response
```typescript
// POST /users with invalid data
{
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "formErrors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Authorization Error Response
```typescript
// Unauthorized access
{
  "message": "Insufficient permissions",
  "errorCode": "FORBIDDEN"
}
```

## Common Query Parameters

### Pagination
```typescript
// Standard pagination parameters
?page=1&limit=20

// Example usage
GET /users?page=2&limit=10
```

### Search
```typescript
// Text search parameter
?q=search_term

// Example usage
GET /users?q=john&page=1&limit=20
```

### Sorting
```typescript
// Sort by field with direction
?sort=[{"id":"createdAt","desc":true}]

// Multiple sort fields
?sort=[{"id":"name","desc":false},{"id":"createdAt","desc":true}]

// Example usage
GET /users?sort=[{"id":"name","desc":false}]
```

### Filtering
```typescript
// Filter by field value
?filter=[{"id":"status","value":"active"}]

// Multiple filters
?filter=[{"id":"status","value":"active"},{"id":"role","value":"admin"}]

// Example usage
GET /users?filter=[{"id":"isEnabled","value":"true"}]
```

### Combined Parameters
```typescript
// Combine multiple query parameters
GET /users?q=john&filter=[{"id":"isEnabled","value":"true"}]&sort=[{"id":"name","desc":false}]&page=1&limit=10
```

## HTTP Status Codes

### Success Codes
- **200 OK** - Successful GET, PUT, DELETE operations
- **201 Created** - Successful POST operations that create resources
- **204 No Content** - Successful operations with no response body

### Client Error Codes
- **400 Bad Request** - Invalid request data or parameters
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists or conflict
- **422 Unprocessable Entity** - Validation errors

### Server Error Codes
- **500 Internal Server Error** - Unexpected server errors
- **503 Service Unavailable** - Service temporarily unavailable

## Authentication

### JWT Token Usage
```typescript
// Include JWT token in Authorization header
Authorization: Bearer <jwt_token>

// Example request
GET /users
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Response
```typescript
// POST /auth/login
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm123456789",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Content Types

### Request Content Types
- **application/json** - JSON data in request body
- **application/x-www-form-urlencoded** - Form data
- **multipart/form-data** - File uploads

### Response Content Types
- **application/json** - All API responses are JSON

## API Versioning

### URL Versioning (Future Implementation)
```typescript
// Version in URL path
GET /api/v1/users
GET /api/v2/users
```

### Header Versioning (Future Implementation)
```typescript
// Version in header
GET /users
Accept: application/json; version=1
```

## Rate Limiting

### Rate Limit Headers
```typescript
// Rate limit information in response headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

### Rate Limit Exceeded Response
```typescript
{
  "message": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## CORS Configuration

### Allowed Origins
- Development: `*` (all origins)
- Production: Specific frontend domains

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization, X-Requested-With

## API Endpoints Reference

### Authentication Endpoints
```typescript
POST /auth/login          // User login
POST /auth/logout         // User logout
POST /auth/refresh        // Refresh access token
GET  /auth/me            // Get current user info
```

### User Management Endpoints
```typescript
GET    /users            // List users
POST   /users            // Create user
GET    /users/:id        // Get user by ID
PUT    /users/:id        // Update user
DELETE /users/:id        // Delete user
```

### Role Management Endpoints
```typescript
GET    /roles            // List roles
POST   /roles            // Create role
GET    /roles/:id        // Get role by ID
PUT    /roles/:id        // Update role
DELETE /roles/:id        // Delete role
```

### Permission Management Endpoints
```typescript
GET /permissions         // List permissions
```

### Application Settings Endpoints
```typescript
GET /app-settings        // Get all app settings
PUT /app-settings/:key   // Update app setting
```

## Error Handling

### Standard Error Codes
- **VALIDATION_ERROR** - Data validation failed
- **UNAUTHORIZED** - Authentication required
- **FORBIDDEN** - Insufficient permissions
- **NOT_FOUND** - Resource not found
- **CONFLICT** - Resource already exists
- **INTERNAL_ERROR** - Server error

### Error Response Structure
```typescript
interface ApiError {
  message: string;           // Human-readable error message
  errorCode: string;         // Machine-readable error code
  formErrors?: {             // Field-specific errors (optional)
    [field: string]: string;
  };
  details?: any;             // Additional error details (optional)
}
```

## Request/Response Examples

### Create User Request
```typescript
// POST /users
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "isEnabled": true
}
```

### Update User Request
```typescript
// PUT /users/cm123456789
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "isEnabled": false
}
```

### List Users with Filtering
```typescript
// GET /users?filter=[{"id":"isEnabled","value":"true"}]&page=1&limit=10
{
  "data": [
    {
      "id": "cm123456789",
      "name": "John Doe",
      "email": "john@example.com",
      "isEnabled": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "_metadata": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

## Best Practices

### API Design
- Use RESTful conventions
- Consistent naming conventions
- Clear error messages
- Proper HTTP status codes
- Include metadata for pagination

### Request/Response Format
- Use JSON for all API communication
- Include proper Content-Type headers
- Validate all input data
- Return consistent response structures
- Handle errors gracefully

### Security
- Always validate authentication
- Check permissions before operations
- Sanitize input data
- Use HTTPS in production
- Implement rate limiting

## Related Documentation

- [Route Development](routes.md) - Creating API endpoints
- [Authentication & Authorization](auth.md) - API security
- [Validation & Type Safety](validation.md) - Request validation
- [Security](security.md) - Security considerations
