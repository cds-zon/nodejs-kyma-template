# Backend-Only Authentication

This document describes the simplified backend-only authentication system. **NO client-side authentication code** - all auth is handled on the server side.

## Overview

The authentication system is now completely backend-based:
- **No client-side auth code**
- **No UI components for login**
- **No localStorage token management**
- **Backend middleware handles all authentication**
- **Request context stores user and token info**

## Architecture

### How It Works

```
Client Request → Backend Middleware → Auth Provider → Request Context → Chat Handler
```

1. **Client Request**: User makes a request to the assistant
2. **Backend Middleware**: Intercepts the request and checks for Authorization header
3. **Auth Provider**: Validates the token using the configured auth provider
4. **Request Context**: Stores user and token information in the request
5. **Chat Handler**: Uses the token from request context to call Mastra API

### Core Components

1. **Backend Middleware** (`lib/auth/backend-middleware.ts`)
   - Handles all authentication logic on the server
   - Validates tokens using auth providers
   - Stores user and token in request context

2. **Auth Providers** (`lib/auth/providers.ts`)
   - Dummy, Mock, and JWT providers
   - Server-side token validation
   - User authentication and authorization

3. **Chat Handler** (`app/_api/chat/route.ts`)
   - Uses token from request context
   - Passes token to Mastra client
   - No client-side auth logic

## Configuration

### Environment Variables

```bash
# Authentication type
NEXT_PUBLIC_AUTH_TYPE=dummy  # or 'mock' or 'jwt'

# API endpoints
NEXT_PUBLIC_ASSISTANT_BASE_URL=http://localhost:4361/api/agents/researchAgent/stream/vnext
MASTRA_BASE_URL=http://localhost:4361

# JWT configuration (if using JWT)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=your-app
JWT_AUDIENCE=your-api
```

### Auth Provider Types

#### 1. Dummy Provider (Development)
```typescript
// Always returns authenticated user
const user = await authProvider.authenticateToken('any-token');
// Returns: { id: 'anonymous', roles: ['admin'], ... }
```

#### 2. Mock Provider (Testing)
```typescript
// Validates against mock users
const user = await authProvider.authenticateToken('mock:alice');
// Returns: { id: 'alice', name: 'Alice', roles: ['admin'], ... }
```

#### 3. JWT Provider (Production)
```typescript
// Validates JWT tokens
const user = await authProvider.authenticateToken('jwt-token');
// Returns: { id: 'user123', name: 'John', roles: ['user'], ... }
```

## Usage

### 1. Development Setup

```bash
# Set auth type to dummy for development
NEXT_PUBLIC_AUTH_TYPE=dummy

# Start the development server
npm run dev
```

The backend will accept any token and return a dummy user.

### 2. Testing with Mock Users

```bash
# Set auth type to mock
NEXT_PUBLIC_AUTH_TYPE=mock

# Test with mock tokens
curl -H "Authorization: Bearer mock:alice" http://localhost:3000/api/chat
curl -H "Authorization: Bearer mock:bob" http://localhost:3000/api/chat
```

### 3. Production with JWT

```bash
# Set auth type to JWT
NEXT_PUBLIC_AUTH_TYPE=jwt

# Configure JWT settings
JWT_SECRET=your-production-secret
JWT_ISSUER=your-app
JWT_AUDIENCE=your-api
```

## Code Examples

### Backend Middleware

```typescript
// lib/auth/backend-middleware.ts
export function withBackendAuth(handler) {
  return async (req: NextRequest) => {
    // Extract token from Authorization header
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    // Authenticate token
    const user = await authProvider.authenticateToken(token);
    
    // Store in request context
    req.user = user;
    req.authToken = token;
    
    // Call handler
    return await handler(req);
  };
}
```

### Chat Handler

```typescript
// app/_api/chat/route.ts
async function handleChat(req: AuthenticatedRequest) {
  // Get token from request context (set by middleware)
  const token = req.authToken;
  const user = req.user;
  
  // Use token with Mastra client
  const mastraClient = new MastraClient({
    baseUrl: baseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await mastraClient.getAgent("researchAgent").streamVNext({
    messages: convertToModelMessages(messages),
  });
}

export const POST = withBackendAuth(handleChat);
```

## Benefits

1. **Simplified Architecture**: No client-side auth complexity
2. **Server-Side Security**: All auth logic on the server
3. **Request Context**: Clean separation of concerns
4. **Easy Testing**: Simple token-based testing
5. **Production Ready**: Supports multiple auth providers

## Security Considerations

- **Token Validation**: All tokens validated on the server
- **Request Context**: User info stored securely in request
- **No Client Storage**: No sensitive data in localStorage
- **Backend Control**: Complete control over authentication flow

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that Authorization header is present
   - Verify token format and validity
   - Check auth provider configuration

2. **403 Forbidden**
   - User authenticated but not authorized
   - Check user roles and permissions
   - Verify auth provider authorization logic

3. **Token Not Passed to Mastra**
   - Check that middleware is setting req.authToken
   - Verify chat handler is using req.authToken
   - Check Mastra client headers

### Debug Logging

The system includes comprehensive logging:
- `🔐 Backend Auth - User authenticated: user123`
- `🔐 Chat Handler - User: user123 Token available: true`

## Migration Notes

This implementation removes all client-side authentication:
- ✅ Removed all client-side auth components
- ✅ Removed localStorage token management
- ✅ Removed UI-based login forms
- ✅ Simplified to backend-only authentication
- ✅ Request context stores user and token info
- ✅ Chat handler uses token from request context

The result is a clean, simple, and secure authentication system that handles everything on the backend.
