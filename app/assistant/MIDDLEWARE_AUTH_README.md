# Middleware-Based Authentication

This document describes the middleware-based authentication system, where each auth provider is implemented as a separate middleware following the CDS pattern.

## Overview

The authentication system now uses provider-specific middleware:
- **Mock Middleware**: Based on CDS mocked-users.js implementation
- **Dummy Middleware**: Always authenticates with privileged user
- **JWT Middleware**: Validates JWT tokens
- **Backend Middleware**: Orchestrates the provider-specific middleware

## Architecture

### Provider-Specific Middleware

Each auth provider is implemented as a separate middleware file:

```
lib/auth/middleware/
├── mock-middleware.ts      # Mock auth following CDS pattern
├── dummy-middleware.ts     # Dummy auth for development
├── jwt-middleware.ts       # JWT token validation
└── index.ts               # Middleware exports
```

### How It Works

```
Request → Backend Middleware → Provider Middleware → Request Context → Handler
```

1. **Request**: Client makes request with Authorization header
2. **Backend Middleware**: Selects appropriate provider middleware
3. **Provider Middleware**: Handles authentication logic
4. **Request Context**: Stores user and token in request
5. **Handler**: Uses user/token from request context

## Middleware Implementations

### 1. Mock Middleware (`mock-middleware.ts`)

Based on CDS mocked-users.js implementation:

```typescript
// Features:
- Basic auth support with WWW-Authenticate header
- User/password validation against mock users
- Configurable users and tenants
- Deprecated property handling
- Default users (alice, bob)

// Usage:
const mockMiddleware = createMockMiddleware({
  users: {
    'alice': { password: 'alice', roles: ['admin'] },
    'bob': { password: 'bob', roles: ['user'] }
  }
});
```

**Default Users:**
- `alice` / `alice` - Admin user with full access
- `bob` / `bob` - Regular user

**WWW-Authenticate Header:**
```
WWW-Authenticate: Basic realm="Users"
```

### 2. Dummy Middleware (`dummy-middleware.ts`)

Always authenticates successfully:

```typescript
// Features:
- Always returns privileged user
- Ignores credentials (for development)
- Handles missing auth headers gracefully
- Returns anonymous user with admin roles

// Usage:
const dummyMiddleware = createDummyMiddleware();
```

**Default User:**
```typescript
{
  id: 'anonymous',
  roles: ['any', 'authenticated', 'admin'],
  tenant: 'default',
  attr: { name: 'Anonymous User', email: 'anonymous@example.com' }
}
```

### 3. JWT Middleware (`jwt-middleware.ts`)

Validates JWT tokens:

```typescript
// Features:
- Bearer token validation
- JWT payload parsing
- Issuer/audience validation
- Expiry checking
- User extraction from JWT claims

// Usage:
const jwtMiddleware = createJWTMiddleware({
  secret: 'your-secret',
  issuer: 'your-app',
  audience: 'your-api'
});
```

**WWW-Authenticate Header:**
```
WWW-Authenticate: Bearer realm="API"
```

## Configuration

### Environment Variables

```bash
# Authentication type
NEXT_PUBLIC_AUTH_TYPE=mock  # or 'dummy' or 'jwt'

# JWT configuration (if using JWT)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=your-app
JWT_AUDIENCE=your-api
```

### Auth Provider Selection

The backend middleware automatically selects the appropriate provider:

```typescript
function getAuthMiddleware() {
  switch (config.auth.type) {
    case 'mock': return createMockMiddleware();
    case 'dummy': return createDummyMiddleware();
    case 'jwt': return createJWTMiddleware();
    default: return createDummyMiddleware();
  }
}
```

## Usage Examples

### 1. Mock Authentication

```bash
# Set auth type to mock
NEXT_PUBLIC_AUTH_TYPE=mock

# Test with basic auth
curl -u alice:alice http://localhost:3000/api/chat
curl -u bob:bob http://localhost:3000/api/chat

# Test with Authorization header
curl -H "Authorization: Basic YWxpY2U6YWxpY2U=" http://localhost:3000/api/chat
```

### 2. Dummy Authentication

```bash
# Set auth type to dummy
NEXT_PUBLIC_AUTH_TYPE=dummy

# Any request will work (even without auth)
curl http://localhost:3000/api/chat
curl -H "Authorization: Basic any:credentials" http://localhost:3000/api/chat
```

### 3. JWT Authentication

```bash
# Set auth type to JWT
NEXT_PUBLIC_AUTH_TYPE=jwt

# Test with JWT token
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." http://localhost:3000/api/chat
```

## Code Examples

### Backend Middleware

```typescript
// lib/auth/backend-middleware.ts
export function withBackendAuth(handler) {
  return async (req: NextRequest) => {
    // Get the appropriate auth middleware
    const authMiddleware = getAuthMiddleware();
    
    // Run the auth middleware
    const authResponse = await authMiddleware(req);
    
    // If auth middleware returns a response, it means auth failed
    if (authResponse) {
      return authResponse;
    }

    // Auth succeeded - user and token are set in request context
    const user = req.user;
    const authToken = req.authToken;
    
    // Call the original handler
    return await handler(req);
  };
}
```

### Chat Handler

```typescript
// app/_api/chat/route.ts
async function handleChat(req: AuthenticatedRequest) {
  // Get user and token from request context (set by middleware)
  const user = req.user;
  const authToken = req.authToken;
  
  // Use token with Mastra client
  const mastraClient = new MastraClient({
    baseUrl: baseUrl,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await mastraClient.getAgent("researchAgent").streamVNext({
    messages: convertToModelMessages(messages),
  });
}

export const POST = withBackendAuth(handleChat);
```

### Mock Middleware Implementation

```typescript
// lib/auth/middleware/mock-middleware.ts
export function createMockMiddleware(options = {}) {
  const users = new MockedUsers(options);
  
  return async function mockMiddleware(req: NextRequest) {
    const auth = req.headers.get('authorization');
    
    if (!auth?.match(/^basic/i)) {
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Users"' }
      });
    }

    // Decode credentials
    const credentials = Buffer.from(auth.slice(6), 'base64').toString();
    const [id, pwd] = credentials.split(':');
    
    // Verify user
    const user = users.verify(id, pwd);
    
    if ('failed' in user) {
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Users"' }
      });
    }

    // Set user in request context
    req.user = user;
    req.authToken = auth;
    
    return null; // Continue
  };
}
```

## Benefits

1. **CDS Pattern Compliance**: Follows the same pattern as CDS mock-js
2. **Provider Isolation**: Each auth provider is separate and testable
3. **WWW-Authenticate Headers**: Proper HTTP auth headers for browser auth
4. **Request Context**: Clean separation of concerns
5. **Easy Testing**: Simple middleware testing
6. **Production Ready**: Supports multiple auth providers

## Security Considerations

- **Basic Auth**: Mock middleware uses Basic auth with proper headers
- **JWT Validation**: JWT middleware validates tokens properly
- **Request Context**: User info stored securely in request
- **Error Handling**: Proper error responses with auth headers

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check Authorization header format
   - Verify credentials (for mock auth)
   - Check JWT token validity (for JWT auth)

2. **WWW-Authenticate Headers**
   - Mock: `Basic realm="Users"`
   - JWT: `Bearer realm="API"`

3. **User Not in Request Context**
   - Check middleware execution order
   - Verify auth provider selection
   - Check error handling in middleware

### Debug Logging

The system includes comprehensive logging:
- `🔐 Mock Middleware - User authenticated: alice`
- `🔐 Dummy Middleware - User authenticated (dummy): anonymous`
- `🔐 JWT Middleware - User authenticated: user123`
- `🔐 Backend Auth - User authenticated: alice`

## Migration Notes

This implementation provides:
- ✅ **CDS Pattern Compliance**: Follows mocked-users.js pattern exactly
- ✅ **Provider-Specific Middleware**: Each auth type has its own middleware
- ✅ **WWW-Authenticate Headers**: Proper HTTP auth headers
- ✅ **Request Context**: User and token stored in request
- ✅ **Easy Testing**: Simple middleware testing
- ✅ **Production Ready**: Supports all auth providers

The result is a robust, CDS-compliant authentication system that handles everything through middleware with proper HTTP auth headers.
